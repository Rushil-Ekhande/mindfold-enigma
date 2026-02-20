You are an expirenced software developer with 15+ years in software and complex system development, and you are assinged with creating the following product:

Mindfold is an AI-powered mental health tracking and reflective journaling platform that transforms daily thoughts into measurable wellness insights.

Implement all the functiobnalities mentioned here

Tech stack using:
-  nextjs for both frontend and backend
- supabse for database and auth
- dodo for payments
- google flash 2.5 for ai 

Best practices to follow:
- keep things server side as much as possible
- keep clean and best code structure
- add proper comments

There should be a landing page, which should have the following sections:
navbar
herosection
features
how to use
user reviews
pricing 
footer

So there would be 3 users mainly:
1. User
2. Thereapist
3. Admin

# User:

# auth:
 The user authentication should be simple there would be only full name and email and password for sign up and email and password for login. When the user sign up he should be redirected to login pahge and then when he logs in then he should be redirected to the user dashbaord page.

# User Dashbaord
 The user dashbaord will have the following pages:
 - Overview page:
    1 section:
    there will be five cards which would show 5 mental metrics i.e mental health, happiness, accountability, stress and burnout risk.
    2 section:
    Quick actions: 3 cards -> write todays entry, ask journal, view wraps
    3 section:
    Graph of the mental metrics
- Journal Page:
    Here there would be a calender in the follwoign strucutre:
    on the top therer would be month name and the year and then there would be prev and next arrow buttons to navigate through the months and for the days, there should be card for every day and the width of the card should be 100%.
    -When the user clicks on the card there should open a journal writer for that entry and there the user can write about his day, the maximum words the user could wtite is 2000 chartacters there would be 3 componenets in the journal writer on the top there would be the actual editor and there should be a incidator of how much character we could write more. then below the editor there should be two columns in one column there would be AI reflection, i.e the summary of that days journal entry, and on the right side of the column there would be the mental metrics. Every entry would have get a mental metrics scorce and the average of that would be displayed on the overview page.
- Ask Journal PAge:
    IN this the user cna ask quesitons to the journal like "why am i falling to keep promises to myself": and the ai wou;ld analyze the users journal entries and gave a detailed personalized answer which will tell the user why they are failing. and this would be in a chat type section there would be two chat mode one would be quick reflect and the other would be deep reflect, in the quick reflect it would take the latest journal entires like of 1-2 weeks and give answer based on that, and in the deep reflect it would take larger context and give answers based on that. There should be the basic functionalities of deleting chat or new chat.
- Therapist:
    In this page, the user should be able to search for the therapist and then select from there plans to opt for. The therapist would have access of defining the quantithy of there services but the services would be fix and those would be - sessions per week (how much times the user cna get a session with therapist). ONce the user get a therapist the my therapist section would change from a search section to a different page were the user can ask for a session with the therapist if it is availiable, then the user can choose which journal entries the therapist can view and which they cannot, keep an option to completely not letting the therpist see anything. there would also be a section were the user would get the summary and prescripiton of every session, and the exercise to do. When the user sends the request for a session it would go to the therapist dashborad.
- Billing:
    Add three basic billing plans starting wiht 9.99 dollars the basic plan, 14.99$ intermidiate 24.99$ advance
- settings:
    Let the user change his name, change his password, delete all the journla entries and lastly delete account


## Therapist

# auth:
For the therapist auth there should be a registration form where initial he would also put things like his full name, email and password but then he would also need to add documents like his Government-issued ID, Professional license number and Degree certificate upload. there would be an optiopn to upload such documents and once uploded they would be submitted and stored in supabase bucket and then the admin and go through them and decide to let the therapist become a member of the app or not. and then once he logs in he wouild be redirected to the therapist dashboard.

# therapist dashboard:
The therapist dashboard would have the following pages:
- Overview page:
    1. where he would be able to see his number of patients and his rating and the amount he earned. there would be three cards in which these metrics should be shown 
    2. 
- Patients:
    Here the  theripist would be able to see all this patient s they would eb abvailable in cards format whrn the thereapist clicks on the card that particular users page would be opened and then he can see the users request of having a session with him, and the users details like if the user has permitted he can view there diaries and there mental metrics, and all. When the session request is arrived the therapist could choose to postponed the session or could accept immedialty,and then there he woudld be able to send a google meet or any other meet tool link, which woukld be arrviing and displayed on the user dashbaord. And then the therapist could enter points and his views on the session there would a doctors note and also a section called prescription were he couild assgin medication or exercises to the user.
- Settings:
    in this there would be option to change his display name, description, pricing and its details and then a seciton to put his photo, and then he could also put his qualitfications and his previous patients testamonies.


## Admin:

# auth:
There should be only one admin which should be hardcoded into the database.

## admin dashboard:

- overview:
 Here the admin would be abel to see the amoutn fo users using the website, the amount of users, and therapists.
- Therapists:
    In this page the admin would eb able to review the documents and information send by the user and verify whether to submit the therapist or not.
- Landing page:
    The admin should be able to change the data of the landing page 