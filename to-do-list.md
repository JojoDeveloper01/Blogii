Project theme: Blogii
This project is a blog website where users can create, edit, and delete their blog posts.

A non-logged in user can only read the blog posts and create a only one blog on the local but to publish it he must be logged in, so the non-user can't publish his blog on the server, only maintain in local.
A user can produce a blog and publish it on the server as many times as he wants.

The user can administrate his blog posts on the dashboard and see analytics about his blog posts.



[X] Improve the blog editor 1
    [X] The title has to be editable,
    [X] cant be create a new blog with the URL if already wasnt created with the blog name creator 
    [X] Has to have a preview button, the link it'll be `id=372843434&editing=false` or something like that

[X] In the home page has to show only the blog name creator and if there's more blogiis, show them but not before

[X] Well load to the input js the title of the blog  

[x] When the blog is created:
    [x] Has to create automatly a Post, "first post"

[X] Add authentication - Supabase (with google, facebook, microsoft)
    [X] Save the User data on the server
    [] Add Local Blog to the DB 
        [] Has to save the temporal blog on the server
        [] If its logged, get the blog from the DB
        [] Has to delete the temporal blog on the local

[x] Add dashboard
    [x] Has to show their posts of the their blog to the user
    [] Has to show the analytics of the blogs of the user (if its logged in)
        [] Create a table to save the analaitics of the blogs of the user
        [] Has to connect with google analitics or something like that
        [] Has to show the number of posts, views, likes of the blog
    [] Has to show the comments of the blogs of the user
    [] Has to show the settings of the blogs of the user

[] Make the publish button
    [] Has to save the blog on the repository, create a .mk on the folder "Content"

[x] Ask to chatGPT how i can make a domian name to link to the blog like `blog-name.myblogii.com`

[] Add Comments on the blog
[] Add the options to enable the comments on the blog

[] Improve the blog editor 2
    [] Should have various templates from the DB
    [] Has to have more options and facilities to edit text easier and edit images like cut them or something like that (has to be something like notion but the top edit bar/panel has to be like "Word"),