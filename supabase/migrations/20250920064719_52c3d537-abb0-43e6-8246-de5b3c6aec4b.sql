-- Add missing posts and comments tables to complete database schema

-- First, check if posts table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts') THEN
        CREATE TABLE public.posts (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_anonymous BOOLEAN DEFAULT false,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Anyone can view posts" 
        ON public.posts 
        FOR SELECT 
        USING (true);

        CREATE POLICY "Authenticated users can create posts" 
        ON public.posts 
        FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

        CREATE POLICY "Users can update their own posts" 
        ON public.posts 
        FOR UPDATE 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own posts" 
        ON public.posts 
        FOR DELETE 
        USING (auth.uid() = user_id);

        -- Add trigger for timestamps
        CREATE TRIGGER update_posts_updated_at
        BEFORE UPDATE ON public.posts
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Check if comments table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        CREATE TABLE public.comments (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            is_anonymous BOOLEAN DEFAULT false,
            likes_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Anyone can view comments" 
        ON public.comments 
        FOR SELECT 
        USING (true);

        CREATE POLICY "Authenticated users can create comments" 
        ON public.comments 
        FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

        CREATE POLICY "Users can update their own comments" 
        ON public.comments 
        FOR UPDATE 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own comments" 
        ON public.comments 
        FOR DELETE 
        USING (auth.uid() = user_id);

        -- Add trigger for timestamps
        CREATE TRIGGER update_comments_updated_at
        BEFORE UPDATE ON public.comments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;