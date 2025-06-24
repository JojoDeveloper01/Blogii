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

[x] Add publish button
[x] Link the "Já tem um blog ativo" and publish button with login modal if the user is not logged in
[x] Improve the organization of the Header 

[X] Add authentication - Supabase (with google, facebook, microsoft)
    [X] Save the User data on the server
    [x] Add Local Blog to the DB 
        [x] Has to save the temporal blog on the server
        [x] Has to delete the temporal blog on the local
        [x] If its logged in, get the blog from the DB

[x] The local logic has to be synchronized with the DB:
    [x] Has to update the title of the blog in the DB
    [x] Has to create the posts on the DB
    [x] Has to work the when open the post
    [x] Has update the the title of teh post on the DB
    [X] Has update the the content of the post on the DB
    [X] Has to Create Blogs on the DB

[x] Add dashboard page
    [x] Has to show the blogs of the user on the dashboard
    [x] Has to show their posts of the their blog to the user
    [x] Has to show the analytics of the blogs of the user (if its logged in)
        [] Create a table to save the analytics of the blogs of the user
        [] Has to connect with google analytics or something like that
        [] Has to show the number of posts, views, likes of the blog
    [] Has to show the comments of the blogs of the user
    [] Has to show the settings of the blogs of the user

[x] Make the publish button
    [] Has to save the blog on the repository, create a .mk on the folder "Content"
    [] Add publish confirmation dialog with post selection

[x] Ask to chatGPT how i can make a domain name to link to the blog like `blog-name.myblogii.com`

[] Add Comments on the blog
[] Add the options to enable the comments on the blog

[x] Add the pricing page, free, monthly payment (with n% discount), annual payment (with n% discount) and unique payment (with n% discount)
[] Add the public Blogs page, blogs created on blogii  
    [] has to show the advanced features of this plan


[] Improve the blog editor 2
    [] Should have various templates from the DB
    [] Has to have more options and facilities to edit text easier and edit images like cut them or something like that (has to be something like notion but the top edit bar/panel has to be like "Word"),