
create table eventcategory(
    category_id int,
    category_name varchar(50),
    primary key(categoy_id)
);

CREATE SEQUENCE eventcategoryseq
START 1000
INCREMENT 1
OWNED BY eventcategory.categoy_id;

insert into eventcategory values(nextval('eventcategoryseq'),'technical'),
(nextval('eventcategoryseq'),'cultural'),
(nextval('eventcategoryseq'),'sports'),
(nextval('eventcategoryseq'),'art and craft'),
(nextval('eventcategoryseq'),'esports');

create table eventhead(
    head_id int,
    head_name varchar(50),
    mobile bigint,
    primary key(head_id)
);

CREATE SEQUENCE eventheadseq
START 2000
INCREMENT 1
OWNED BY eventhead.head_id;

insert into eventhead values(nextval('eventheadseq'),'manu',7022426835),
(nextval('eventheadseq'),'omkar',7022426836),
(nextval('eventheadseq'),'vikas',7022426837),
(nextval('eventheadseq'),'shashi',7022426838),
(nextval('eventheadseq'),'prateek',7022426839),
(nextval('eventheadseq'),'varshanth',7022426830),
(nextval('eventheadseq'),'gokul',7022426831),
(nextval('eventheadseq'),'adithya',7022426832),
(nextval('eventheadseq'),'mahadev',7022426833),
(nextval('eventheadseq'),'deeraj',7022426834),
(nextval('eventheadseq'),'jothi prakash',7022426845),
(nextval('eventheadseq'),'karthik',7022426855),
(nextval('eventheadseq'),'namanu',7022426865);

create table events(
    event_id int,
    event_title varchar(50),
    price int,
    no_of_participants int,
    category_id int,
    head_id int,
    primary key(event_id),
    foreign key(category_id) references eventcategory(categoy_id) on delete set null,
    foreign key(head_id) references eventhead(head_id) on delete set null
);

CREATE SEQUENCE eventsseq
START 100
INCREMENT 1
OWNED BY events.event_id;

insert into events values(nextval('eventsseq'),'hackathon',400,4,1000,2000),
(nextval('eventsseq'),'ideathon',200,2,1000,2001),
(nextval('eventsseq'),'volleyball',800,8,1002,2002),
(nextval('eventsseq'),'cricket',1000,10,1002,2003),
(nextval('eventsseq'),'dance',1000,10,1001,2004),
(nextval('eventsseq'),'fashion-show',800,8,1001,2005),
(nextval('eventsseq'),'drama',1000,10,1001,2006),
(nextval('eventsseq'),'singing',200,1,1001,2007),
(nextval('eventsseq'),'painting',300,3,1003,2008),
(nextval('eventsseq'),'photography',200,1,1003,2009),
(nextval('eventsseq'),'sculpture making',200,2,1003,2010),
(nextval('eventsseq'),'pubg',600,4,1004,2011),
(nextval('eventsseq'),'valorant',600,4,1004,2012);

create table team(
    team_id int,
    team_name varchar(50),
    event_id int,
    primary key(team_id),
    foreign key (event_id) references events(event_id) on delete cascade
);

CREATE SEQUENCE teamseq
START 5000
INCREMENT 1
OWNED BY team.team_id;

create table participant(
    p_id int,
    p_name varchar(50),
    email varchar(50),
    mobile bigint,
    college varchar(50),
    branch varchar(50),
    primary key(p_id)
);

CREATE SEQUENCE participantseq
START 3000
INCREMENT 1
OWNED BY participant.p_id;

create table mteam(
    p_id int,
    team_id int,
    primary key(p_id, team_id),
    foreign key(p_id) references participant(p_id) on delete cascade,
    foreign key(team_id) references team(team_id) on delete cascade
);

create table mevent(
    p_id int,
    event_id int,
    primary key(p_id,event_id),
    foreign key(p_id) references participant(p_id) on delete cascade,
    foreign key(event_id) references events(event_id) on delete cascade
);

select distinct p.* , tm.team_name from mevent m,participant p,mteam t,team tm where m.p_id = p.p_id and m.p_id = t.p_id and t.team_id = tm.team_id and m.event_id = 101 and tm.event_id = 101 order by tm.team_name;
select e.*,c.category_name,h.head_name,h.mobile from events e,eventcategory c,eventhead h where e.category_id = c.category_id and e.head_id = h.head_id and e.event_id = 101;


-- adding on delete cascade constraint to existing foreign key(to find this --> team_event_id_fkey goto tables and properties and constraints n foreign key)
alter table team drop constraint team_event_id_fkey;
alter table team add constraint team_event_id_fkey foreign key (event_id) references events (event_id) on delete cascade;

-- this for altering primary key first drop then add
alter table mteam add constraint mteam_pkey primary key (p_id,team_id);

select e.event_title,t.team_id,t.team_name ,eh.head_name,eh.mobile from participant p ,mteam mt,team t ,events e ,eventhead eh where p.p_id = mt.p_id and mt.team_id = t.team_id and t.event_id = e.event_id  and e.head_id = eh.head_id and p.email = 'manukumar6107@gmail.com';

select e.event_title ,eh.head_name,eh.mobile from participant p ,mevent me ,events e ,eventhead eh where p.p_id = me.p_id and me.event_id = e.event_id   and e.head_id = eh.head_id and e.no_of_participants =1  and p.email = 'manukumar6107@gmail.com' ;

select p.* from mevent m,participant p where m.p_id = p.p_id and m.event_id = 101; 

create table userRegstrTime(
    id int,
    email varchar(50),
    registered_time timestamp default now()
);



CREATE FUNCTION ts_fun()   
   RETURNS TRIGGER   
   LANGUAGE PLPGSQL  
AS $$  
BEGIN  
    insert into userRegstrTime values(new.id,new.email);
    RETURN NEW;
END;  
$$  

CREATE TRIGGER userTime
after insert on users
for each row
EXECUTE PROCEDURE ts_fun();