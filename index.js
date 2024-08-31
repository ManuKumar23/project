import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "emsDatabase",
    password: "12345678",
    port: 5432,
});

db.connect();

let categoryList = [];
let eventList = [];
let eventDetails = [];
let teams = [];

let chosenEvent;
let numberOfPart;
let currentUser;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req,res)=>{
  try{
      res.render("home.ejs");
    } catch (err) {
      console.log(err);
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.render("loginAlerts.ejs",{
        alertMsg : "Email already exists. Try logging in.",
        hrf : "/register"
      });
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password]
      );
      console.log(result);
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  currentUser = req.body.username;
  const password = req.body.password;
  const role = req.body.role;

  try {
    if(role === 'user'){
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedPassword = user.password;
  
        if (password === storedPassword) {
          res.redirect("/userMenu");
        } else {
          res.render("loginAlerts.ejs",{
            alertMsg : "Incorrect Password",
            hrf : "/login"
          });
        }
      } else {
        res.render("loginAlerts.ejs",{
          alertMsg : "User not found",
          hrf : "/login"
        });
      }
    }else{
      const result = await db.query("SELECT * FROM admins WHERE email = $1", [
        email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedPassword = user.password;
  
        if (password === storedPassword) {
            res.redirect("/adminMenu");
        } else {
          res.render("loginAlerts.ejs",{
            alertMsg : "Incorrect Password",
            hrf : "/login"
          });
        }
      } else {
        res.render("loginAlerts.ejs",{
            alertMsg : "User not found",
            hrf : "/login"
          });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//user pages

app.get("/userMenu",async(req , res) => {
  res.render("userMenu.ejs");
}) ;

app.get("/category",async(req , res) => {

  //fetching all the event categories
  const result = await db.query("SELECT * FROM eventcategory");
  categoryList = result.rows;
  console.log(categoryList);
  res.render("categories.ejs", {
  title: "Choose event category",
  categoryArray: categoryList
  });
}) ;

app.get("/revents",async(req , res) => {

  //fetching all the event categories
  const teamResult = await db.query("select e.event_title,t.team_id,t.team_name ,eh.head_name,eh.mobile from participant p ,mteam mt,team t ,events e ,eventhead eh where p.p_id = mt.p_id and mt.team_id = t.team_id and t.event_id = e.event_id  and e.head_id = eh.head_id and p.email =  $1",[currentUser]);
  let teamEvents = teamResult.rows;
  const soloResult = await db.query("select e.event_title ,eh.head_name,eh.mobile from participant p ,mevent me ,events e ,eventhead eh where p.p_id = me.p_id and me.event_id = e.event_id   and e.head_id = eh.head_id and e.no_of_participants =1  and p.email =  $1",[currentUser]);
  let soloEvents = soloResult.rows;
  console.log(teamEvents);
  console.log(soloEvents);
  res.render("revents.ejs", {
  tEvents : teamEvents,
  sEvents : soloEvents
  });
}) ;


app.post("/events", async (req, res) => {
    console.log(req.body);
    let chosenCategory = req.body.chosenResult
    try{
        //fetching all the events under  a selected category
        const result = await db.query("SELECT event_id,event_title FROM events where category_id = $1",[chosenCategory]);
        eventList = result.rows;
        console.log(eventList);
        res.render("events.ejs", {
          title: "Choose event ",
          eventArray: eventList
        });
      } catch (err) {
        console.log(err);
    }
});

app.post("/eventDetails", async (req, res) => {
    console.log(req.body);
    chosenEvent = req.body.chosenResult
    try{
        //fetching all the details of selected event 
        const result = await db.query("SELECT E.event_title,E.price,E.no_of_participants,H.head_name,H.mobile FROM events E,eventhead H where E.head_id=H.head_id and E.event_id = $1",[chosenEvent]);
        eventDetails = result.rows;
        console.log(eventDetails);
        numberOfPart = eventDetails[0].no_of_participants;
        res.render("eventDetails.ejs", {
          title: "Event Details",
          eventArray: eventDetails
        });
      } catch (err) {
        console.log(err);
    }
});

app.get("/registerForm", async (req, res) => {

    try{

      //checking if the user already registerd for any of the events
      const result = await db.query("SELECT * FROM participant WHERE email = $1", [
        currentUser,
      ]);
      let hideflag =true;
      let resultLength;
      console.log("length of result : " + result.rows.length);

      //checking if he is registering for the same event twice
      if(result.rows.length > 0){
        hideflag = false;
        console.log(chosenEvent);
        const result1 = await db.query("select event_id from mevent where event_id = $1 and event_id in( SELECT m.event_id FROM  mevent m , participant p WHERE m.p_id = p.p_id and p.email = $2)", [
          chosenEvent,
          currentUser
        ]);
        console.log(result1.rows);
        resultLength=result1.rows.length;
        console.log(resultLength);
      }

      //if he registering second tym for the same event then send alert msg
      if( resultLength > 0) {
        res.render("alert.ejs",{
        alertMsg : "You have already registerd for this event",
        show:false
      });
      //if he is registering for the first time (or registered but registering for the team event) generate registration form
      }else if(result.rows.length === 0 || numberOfPart > 1){
      res.render("registerForm.ejs",{
        nop : numberOfPart,
        hide :  hideflag,
        title : "Registration Form"
      });
      //if he is already registered for any of the event previously(and registering for solo event) no need of registration form again just insert into mevent table
      }else{
        res.redirect("/suc");
      }
      } catch (err) {
        console.log(err);
    }
});

//no need of registration form directly display  success page 
app.get("/suc", async (req, res) => {
  try{
    const result1 = await db.query("SELECT * FROM participant WHERE email = $1", [
      currentUser,
    ]);
    console.log(result1.rows);
    let p_id = result1.rows[0].p_id;
    await db.query("insert into mevent values($1,$2)",[p_id,chosenEvent]);
    res.render("finalPage.ejs",{
      newteam : false
    });
  }catch(err){
    console.log(err);
  }
});


//for providing registration form
app.post("/success", async (req, res) => {
  try{  
        let newteam = false;
        let teamId;
        //checking again if the user registering for the first time
        const result = await db.query("SELECT * FROM participant WHERE email = $1", [
          currentUser,
        ]);
        
        //if it is first time insert data into participant table
        if (result.rows.length === 0) {
          let phone = parseInt(req.body.phone)
          await db.query("INSERT INTO participant VALUES (nextval('participantseq'),$1,$2,$3,$4,$5)", [req.body.fname,currentUser,phone,req.body.college,req.body.branch]);
        }

        //for getting the p_id (if he is registering for the first time p_id will only generate in the line just above this)
        const result1 = await db.query("SELECT * FROM participant WHERE email = $1", [
          currentUser,
        ]);

        console.log(result1.rows);
        let p_id = result1.rows[0].p_id;
        let flag = false;

        //for team events
        if(numberOfPart > 1){
          let teamName = req.body.team;
          let tid = req.body.teamId;
          let newOrOld = req.body.newOrExisting;

          if(teamName === "" && newOrOld === 'new'){
            res.render("alert.ejs",{
              alertMsg : "team name cannot be empty",
              show:true
            });
          }
          if( newOrOld === 'Existing' && tid === ""){
            res.render("alert.ejs",{
              alertMsg : "team id cannot be empty",
              show:true
            });
          }
          //checking  whether the team name already exists or not
          let result;
          if (newOrOld === 'new' &&  teamName !== ""){
            result = await db.query("SELECT * FROM team WHERE team_name = $1", [
              teamName
            ]);
          }
          if(newOrOld === 'Existing' && tid !== ""){
            result = await db.query("SELECT * FROM team WHERE team_id = $1", [
              tid
            ]);
          }

          //case - 1 :if it is new team and teamName is not repeated
          if (result.rows.length === 0 && newOrOld === 'new' && teamName !== "") {
            //since it is a new team insert it into team table
            newteam = true;
            await db.query("INSERT INTO team VALUES (nextval('teamseq'),$1,$2)", [teamName,chosenEvent]);
            flag = true;
            const result1 = await db.query("SELECT * FROM team WHERE team_name = $1", [
              teamName,
            ]);
            console.log(result1.rows);
            teamId = result1.rows[0].team_id;
            await db.query("insert into mteam values($1,$2)",[p_id,teamId]);
          }

          //cas-2:new team but teamName is already taken by some other team
          else if (result.rows.length > 0 && newOrOld === 'new' && teamName !== "") {
              res.render("alert.ejs",{
              alertMsg : "team already exist. Try different name",
              show:true
            });

          //cas-3:joining the already created team(no need to insert it into team table but to mteam) but enters wrong name
          }else if (result.rows.length === 0 && newOrOld === 'Existing' && tid !== "") {
            res.render("alert.ejs",{
              alertMsg : "team doesnot exist . please recheck the team id",
              show:true
            });

          //case-4:joining the already created team n team found in team table
          }else if(tid !== ""){

            //check if the team he is joing is actually for a selected event or not(he selects ideathon event but the team he selected is a kabaddi team ) display alert
            const teamEve = await db.query("select event_id from team where team_id = $1", [
              tid,
            ]);

            const cnt = await db.query("select count(p_id) as count from mteam where team_id = $1", [
              tid
            ]);
            console.log(chosenEvent);
            console.log(teamEve.rows[0].event_id);
            if(teamEve.rows[0].event_id !== parseInt(chosenEvent)){
              res.render("alert.ejs",{
                alertMsg : "team doesnot exist . please recheck the name or choose correct event",
                show:true
              });
            }
            //checking if the team is full , if it is full show an alert
            else if(cnt.rows[0].count >= numberOfPart){
              res.render("alert.ejs",{
                alertMsg : "team is full . please recheck the team Id or create a new one",
                show:true
              });

            //final case : joining the team which is not full.
            }else{
              await db.query("insert into mteam values($1,$2)",[p_id,tid]);
              flag = true;
            }
            
          }
      }

      //insert into mevent only if is solo event or only if the user successfully joined the team
      if((numberOfPart>0 && flag) || numberOfPart === 1){
        await db.query("insert into mevent values($1,$2)",[p_id,chosenEvent]);
      }
      res.render("finalPage.ejs",{
        newteam : newteam,
        teamId :  teamId
      });
    } catch (err) {
      console.log(err);
  }
});

//admin pages


let NOP;
app.get("/adminMenu",async(req , res) => {
  res.render("adminPages/adminMenu.ejs");
}) ;


app.get("/addEvent",async (req, res) => {
  try{
    const result = await db.query("SELECT * FROM eventcategory");
    categoryList = result.rows;
    console.log(categoryList);
    res.render("adminPages/addEvent.ejs", {
    categoryArray: categoryList
    });
  }catch(err){
    console.log(err);
  }
});

app.get("/deleteEvent",async (req, res) => {
  try{
    const result = await db.query("SELECT event_id,event_title FROM events");
    eventList = result.rows;
    console.log(eventList);
    res.render("adminPages/deleteEvent.ejs", {
      eventArray: eventList
    });
  }catch(err){
    console.log(err);
  }
});

app.get("/updateEvent", async (req, res) => {
  try{
    const result = await db.query("SELECT event_id,event_title FROM events");
    eventList = result.rows;
    console.log(eventList);
    res.render("adminPages/updateEvent.ejs", {
      eventArray: eventList
    });
  }catch(err){
    console.log(err);
  }
});

app.get("/edetails",async (req, res) => {
  try{
    const result = await db.query("SELECT * FROM eventcategory");
    categoryList = result.rows;
    console.log(categoryList);
    res.render("adminPages/edetails.ejs", {
    categoryArray: categoryList
    });
  }catch(err){
    console.log(err);
  }
});

app.get("/pdetails",async (req, res) => {
  try{
    const result = await db.query("SELECT event_id,event_title,no_of_participants FROM events");
    eventList = result.rows;
    console.log(eventList);
    res.render("adminPages/pdetails.ejs", {
      eventArray: eventList
    });
  }catch(err){
    console.log(err);
  }
});

app.post('/addControl', async (req,res)=>{
  try{
    const phone = parseInt(req.body.phone);
    console.log(typeof(phone));
    const result = await db.query("SELECT * FROM events WHERE event_title = $1", [
      req.body.title
    ]);
    if (result.rows.length === 0) {
      await db.query("insert into eventhead values(nextval('eventheadseq'),$1,$2)",[req.body.hname,phone]);
      const result = await db.query("select max(head_id) as head_id from eventhead");
      let hid = parseInt(result.rows[0].head_id);
      let price = parseInt(req.body.price);
      let nop = parseInt(req.body.nop);
      let cid = parseInt(req.body.chosenResult);
      console.log(result.rows);
      console.log(price);
      console.log(nop);
      console.log(cid);
      await db.query("INSERT INTO events VALUES(nextval('eventsseq'),$1,$2,$3,$4,$5)", [req.body.title,price,nop,cid,hid]);

      res.render("adminPages/finalPage.ejs",{
        result : "Successfully added the Event!" 
      });

    }else{
      res.render("adminPages/alert.ejs",{
        alertMsg : "Event Already exist!",
        show:true,
        hrf : "/addEvent"
      });
    }
  }catch(err){
    console.log(err);
  }
});

app.post('/deleteControl', async (req,res)=>{
  try{
   let eid = parseInt(req.body.chosenResult);
   const result = await db.query("select head_id  from events where event_id = $1 ",[eid]);
   let hid = parseInt(result.rows[0].head_id);
   console.log(hid);
   await db.query("DELETE FROM eventhead WHERE head_id= $1",[hid]);
   await db.query("DELETE FROM events WHERE event_id= $1",[eid]);
   res.render("adminPages/finalPage.ejs",{
    result : "Successfully deleted the Event!" 
  });
  }catch(err){
    console.log(err);
  }
});

app.post('/edetailsControl', async (req,res)=>{
  try{
   let cid = parseInt(req.body.chosenResult);
   const result = await db.query("SELECT E.event_title,E.price,E.no_of_participants,H.head_name,H.mobile FROM events E,eventhead H where E.head_id=H.head_id and E.category_id = $1",[cid]);
   let data = result.rows;
   console.log(result.rows);
   res.render("adminPages/edetails2.ejs",{
    edata : data
  });
  }catch(err){
    console.log(err);
  }
});

app.post('/pdetailsControl', async (req,res)=>{
  try{
   let eid = parseInt(req.body.chosenResult);
   const result = await db.query("SELECT no_of_participants FROM events where event_id = $1",[eid]);
   NOP =  parseInt(result.rows[0].no_of_participants) ;
   if(NOP > 1){
    const tResult = await db.query("select distinct p.* , tm.team_name from mevent m,participant p,mteam t,team tm where m.p_id = p.p_id and m.p_id = t.p_id and t.team_id = tm.team_id and m.event_id = $1 and tm.event_id = $1 order by tm.team_name ",[eid]);
    let tdata = tResult.rows;
    console.log(tResult.rows);
    res.render("adminPages/pdetails2.ejs",{
      pdata : tdata
    });
   }else{
    const tResult = await db.query("select p.* from mevent m,participant p where m.p_id = p.p_id and m.event_id =$1 ",[eid]);
    let tdata = tResult.rows;
    console.log(tResult.rows);
    res.render("adminPages/pdetails3.ejs",{
      pdata : tdata
    });
   }
  }catch(err){
    console.log(err);
  }
});

let eid;
app.post('/updateControl', async (req,res)=>{
  try{
    eid = parseInt(req.body.chosenResult);
    const result = await db.query("select e.*,c.category_name,h.head_name,h.mobile from events e,eventcategory c,eventhead h where e.category_id = c.category_id and e.head_id = h.head_id and e.event_id = $1",[eid]);
    let data = result.rows;
    console.log(result.rows);
    const result1 = await db.query("SELECT * FROM eventcategory");
    categoryList = result1.rows;
    console.log(categoryList);
   res.render("adminPages/updateEvent2.ejs",{
    pdata : data ,
    categoryArray: categoryList
  });
  }catch(err){
    console.log(err);
  }
});

app.post('/updateControl2', async (req,res)=>{
  try{
    console.log(req.body);
    if(req.body.title){
      await db.query("update events set event_title = $1 where event_id = $2",[req.body.title,eid]);
    }
    if(req.body.price){
      await db.query("update events set price = $1 where event_id = $2",[parseInt(req.body.price),eid]);
    }
    if(req.body.nop){
      await db.query("update events set no_of_participants = $1 where event_id = $2",[parseInt(req.body.nop),eid]);
    }
    if(req.body.category){
      await db.query("update events set category_id = $1 where event_id = $2",[parseInt(req.body.category),eid]);
    }
    const result = await db.query("select head_id from events where event_id = $1",[eid]);
    var hid = result.rows[0].head_id;
    if(req.body.hname){
      await db.query("update eventhead set head_name = $1 where head_id = $2",[req.body.hname,hid]);
    }
    if(req.body.hmobile){
      await db.query("update eventhead set mobile = $1 where head_id = $2",[parseInt(req.body.hmobile),hid]);
    }
    res.render("adminPages/finalPage.ejs",{
      result : "Successfully updated the Event!" 
    });
  }catch(err){
    console.log(err);
  }
});



app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});