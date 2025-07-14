import type { SubscriptionPlan } from "./types";

export const SITE_TITLE = 'Blogii';
export const SITE_DESCRIPTION = 'Your ideas, your blog';

export function getSubscriptionsPlans(getSubsPlan: SubscriptionPlan[]) {
    //Prices
    const FREE_PRICE = getSubsPlan[0].price;
    const MONTHLY_PRICE = getSubsPlan[1].price;
    const ANNUAL_PRICE = getSubsPlan[2].price;
    const LIFETIME_PRICE = getSubsPlan[3].price;

    //Limits
    const BLOGS_LIMIT_FREE = getSubsPlan[0].blog_limit;
    const POSTS_LIMIT_FREE = getSubsPlan[0].post_limit;
    const BLOGS_LIMIT_MONTHLY = getSubsPlan[1].blog_limit;
    const POSTS_LIMIT_MONTHLY = getSubsPlan[1].post_limit;
    const BLOGS_LIMIT_ANNUAL = getSubsPlan[2].blog_limit;
    const POSTS_LIMIT_ANNUAL = getSubsPlan[2].post_limit;

    //Features
    const FEATURES_FREE = getSubsPlan[0].features;
    const FEATURES_MONTHLY = getSubsPlan[1].features;
    const FEATURES_ANNUAL = getSubsPlan[2].features;
    const FEATURES_LIFETIME = getSubsPlan[3].features;

    return {
        FREE_PRICE,
        MONTHLY_PRICE,
        ANNUAL_PRICE,
        LIFETIME_PRICE,
        BLOGS_LIMIT_FREE,
        POSTS_LIMIT_FREE,
        BLOGS_LIMIT_MONTHLY,
        POSTS_LIMIT_MONTHLY,
        BLOGS_LIMIT_ANNUAL,
        POSTS_LIMIT_ANNUAL,
        FEATURES_FREE,
        FEATURES_MONTHLY,
        FEATURES_ANNUAL,
        FEATURES_LIFETIME
    };
}

//Create 
export const createNewBlogMessage = "What's your next great idea? Start a blog and share your passion with the world!";

//Errors
export const amountCharactersError = "The title must be at least 3 characters long."
export const invalidCharactersError = "The title contains invalid characters."
export const blogAlreadyCreated = "You already have an active blog."
export const signInToCreateMoreBlogs = "Sign in to create up to more than one blog."
export const signInToPublishBlog = "Sign in to publish your blog."
export const signInToAccessAllFeatures = "Sign in to access all features."
export const upgradeToCreateMoreBlogsAndPosts = (lang: string) => `Upgrade to create more blogs and posts. <a class="text-[--primary] hover:underline" href='/${lang}/pricing'>Upgrade</a>`
export const ThereWasAnErrorCheckingYourPlan = "There was an error checking your plan."

//Messages
export const blogUnpublished = "If you unpublish a blog, all posts will become private and only you will be able to see them. Please be certain."
