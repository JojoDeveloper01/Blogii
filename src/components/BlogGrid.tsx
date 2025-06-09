import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { blogDB } from '@services/indexedDB';
import type { BlogData } from '@lib/types';

interface BlogGridProps {
    lang: string;
}

export const BlogGrid = component$<BlogGridProps>(({ lang }) => {
    const blogs = useSignal<BlogData[]>([]);

    // Fetch drafts and temp blog on component mount
    useVisibleTask$(async () => {
        try {
            const allBlogs = await blogDB.getAllBlogs();
            blogs.value = allBlogs;
        } catch (error) {
            console.error('Error fetching blogs:', error);
        }
    });

    return (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {blogs.value.map((blog, index) => {
                // Parse blog content to get first image and text
                let content: any = {};
                try {
                    content = typeof blog.body === 'string' ? JSON.parse(blog.body) : blog.body;
                } catch (e) {
                    console.error('Error parsing blog content for blog', blog.id, ':', e);
                }

                // Find first image block
                const imageBlock = content.blocks?.find((block: { type: string }) => block.type === 'image');
                // Find first text block
                const textBlock = content.blocks?.find((block: { type: string }) => block.type === 'paragraph');

                // Determine if this should be a featured (larger) card
                const isFeatured = index === 0 || index === 3;
                const cardClass = isFeatured ? 'md:col-span-2 md:row-span-2' : '';

                return (
                    <a 
                        key={blog.id}
                        href={`/temp?id=${blog.id}&editing=true`}
                        class="block relative overflow-hidden rounded-lg shadow hover:shadow-lg transition-all duration-300 aspect-square hover:scale-[1.02]"
                    >
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10"></div>
                        
                        {imageBlock ? (
                            <img 
                                src={imageBlock.data.file.url} 
                                alt={blog.data.title}
                                class="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div class="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"></div>
                        )}

                        <div class="absolute inset-0 flex flex-col z-20 p-4">
                            {/* Dark overlay */}
                            <div class="absolute inset-0 bg-black/50"></div>
                            
                            {/* Content */}
                            <div class="relative z-10 flex flex-col h-full">
                                <h2 class="text-lg font-bold text-white mb-2">
                                    {blog.data.title}
                                </h2>
                                
                                {textBlock && (
                                    <p class="text-sm text-gray-200 line-clamp-2 mb-4">
                                        {textBlock.data.text    }
                                    </p>
                                )}
                                
                                <button 
                                    onClick$={async (e) => {
                                        e.preventDefault();
                                        try {
                                            await blogDB.saveBlog({
                                                ...blog,
                                            });
                                            window.location.reload();
                                        } catch (error) {
                                            console.error('Error publishing:', error);
                                        }
                                    }}
                                    class="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </a>
                );
            })}
        </div>
    );
});
