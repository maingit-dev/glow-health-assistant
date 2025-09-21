import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Plus, User, Search, Filter, TrendingUp, Clock, Reply } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Post {
  id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  tags: string[];
  created_at: string;
  user_id: string;
  updated_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  user_id: string;
  parent_id?: string;
  replies?: Comment[];
}

type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_commented';
type FilterOption = 'all' | 'my_posts' | 'anonymous';

export const CommunityForum = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: "",
    is_anonymous: false
  });
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    checkUser();
    fetchPosts();
    setupRealtimeSubscriptions();
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [posts, searchQuery, sortBy, filterBy]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to posts changes
    const postsChannel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts(prev => [payload.new as Post, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(post => 
              post.id === payload.new.id ? payload.new as Post : post
            ));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(post => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as Comment;
            setComments(prev => ({
              ...prev,
              [newComment.post_id]: [...(prev[newComment.post_id] || []), newComment]
            }));
          }
        }
      )
      .subscribe();
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...posts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply user filter
    if (filterBy === 'my_posts' && user) {
      filtered = filtered.filter(post => post.user_id === user.id);
    } else if (filterBy === 'anonymous') {
      filtered = filtered.filter(post => post.is_anonymous);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_liked':
          return b.likes_count - a.likes_count;
        case 'most_commented':
          return b.comments_count - a.comments_count;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [posts, searchQuery, sortBy, filterBy, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await (supabase as any).from('posts').select('*').order('created_at', { ascending: false });

      if (error) {
        console.error('Posts fetch error:', error);
        throw error;
      }
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await (supabase as any).from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });

      if (error) {
        console.error('Comments fetch error:', error);
        throw error;
      }
      
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error("Failed to load comments");
    }
  };

  const createPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const tags = newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      const { error } = await (supabase as any)
        .from('posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          tags,
          is_anonymous: newPost.is_anonymous,
          user_id: user.id
        });

      if (error) throw error;

      setNewPost({ title: "", content: "", tags: "", is_anonymous: false });
      fetchPosts();
      toast.success("Post created successfully!");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
    }
  };

  const createComment = async (postId: string, parentId?: string) => {
    if (!user || !newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('comments')
        .insert({
          post_id: postId,
          content: newComment,
          user_id: user.id,
          parent_id: parentId || null
        });

      if (error) throw error;

      setNewComment("");
      setReplyingTo(null);
      fetchComments(postId);
      
      // Update comments count only for top-level comments
      if (!parentId) {
        await (supabase as any)
          .from('posts')
          .update({ comments_count: (comments[postId]?.length || 0) + 1 })
          .eq('id', postId);
        
        fetchPosts();
      }
      
      toast.success(parentId ? "Reply added!" : "Comment added!");
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error("Failed to add comment");
    }
  };

  const toggleLike = async (postId: string, currentLikes: number) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('posts')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', postId);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to like post");
    }
  };

  const handlePostClick = (postId: string) => {
    setSelectedPost(postId);
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const getPaginatedPosts = () => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const organizeComments = (comments: Comment[]): Comment[] => {
    const topLevel = comments.filter(comment => !comment.parent_id);
    return topLevel.map(comment => ({
      ...comment,
      replies: comments.filter(reply => reply.parent_id === comment.id)
    }));
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`bg-muted/50 p-3 rounded-lg ${isReply ? 'ml-6 mt-2' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {comment.is_anonymous ? "?" : <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {comment.is_anonymous ? "Anonymous" : "User"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-auto p-1"
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm mb-2">{comment.content}</p>
      
      {/* Reply form */}
      {replyingTo === comment.id && user && (
        <div className="mt-3 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1"
            rows={2}
          />
          <Button 
            onClick={() => createComment(selectedPost!, comment.id)}
            variant="wellness"
            size="sm"
          >
            Reply
          </Button>
        </div>
      )}
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="wellness" className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title..."
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newPost.tags}
                  onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="health, wellness, period, mood..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={newPost.is_anonymous}
                  onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, is_anonymous: checked }))}
                />
                <Label htmlFor="anonymous">Post anonymously</Label>
              </div>
              
              <Button onClick={createPost} className="w-full" variant="wellness">
                Create Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Newest
              </div>
            </SelectItem>
            <SelectItem value="oldest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Oldest
              </div>
            </SelectItem>
            <SelectItem value="most_liked">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Liked
              </div>
            </SelectItem>
            <SelectItem value="most_commented">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Most Commented
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="my_posts">My Posts</SelectItem>
            <SelectItem value="anonymous">Anonymous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {getPaginatedPosts().map((post) => (
          <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader onClick={() => handlePostClick(post.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                  <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {post.is_anonymous ? "?" : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.is_anonymous ? "Anonymous" : "User"}</span>
                </div>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardFooter className="flex justify-between items-center pt-0">
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(post.id, post.likes_count);
                  }}
                  className="gap-1"
                >
                  <Heart className="h-4 w-4" />
                  {post.likes_count}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePostClick(post.id)}
                  className="gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count}
                </Button>
              </div>
              
              <span className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </CardFooter>
            
            {selectedPost === post.id && (
              <CardContent className="border-t pt-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Comments</h3>
                  
                  {comments[post.id] && comments[post.id].length > 0 ? (
                    <div className="space-y-3">
                      {organizeComments(comments[post.id]).map((comment) => renderComment(comment))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
                  )}
                  
                  {user && (
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1"
                        rows={2}
                      />
                      <Button 
                        onClick={() => createComment(post.id)}
                        variant="wellness"
                        size="sm"
                      >
                        Post
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {filteredPosts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || filterBy !== 'all' ? 'No posts found' : 'No posts yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Be the first to start a conversation!'}
          </p>
          {user && !searchQuery && filterBy === 'all' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="wellness">Create First Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter post title..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts..."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newPost.tags}
                      onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="health, wellness, period, mood..."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="anonymous"
                      checked={newPost.is_anonymous}
                      onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, is_anonymous: checked }))}
                    />
                    <Label htmlFor="anonymous">Post anonymously</Label>
                  </div>
                  
                  <Button onClick={createPost} className="w-full" variant="wellness">
                    Create Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
};