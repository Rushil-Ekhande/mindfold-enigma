Now i want to modify the app to also show the mood of the user in both the therapist's profile and the user's profile. based on their current daily journal entry results, the AI model should also return the mood of the user in the response. that mood should be displayed in the user's profile on the dashboard near the greeting part, and in the therapist's profile on the patient's card. 

# Server Side Backend

currently the application uses NEXT_PUBLIC variables and client side calls to supabase for most backend tasks. i want to make the backend fully server side and make it safer and avoid the use of NEXT_PUBLIC variables and only use client side supabase backend for things like image upload. so modify the exisiting application and make majority of the backend server side, and do not modify anything else
 