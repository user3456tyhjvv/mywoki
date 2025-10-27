import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ScrapingComment } from '../types';
import { MessageIcon, PaperAirplaneIcon, UserIcon, LinkIcon, EmojiIcon, CopyIcon, ShareIcon } from './Icons';
import EmojiPicker from 'emoji-picker-react';

interface CommentSectionProps {
  websiteUrl: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ websiteUrl }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ScrapingComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);

  const getAvatarUrl = (userId: string | undefined) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'anonymous'}`;
  };

  useEffect(() => {
    fetchComments();
  }, [websiteUrl]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_comments')
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            email,
            created_at
          ),
          replies:scraping_comments!parent_id (
            *,
            user:profiles!user_id (
              id,
              name,
              email,
              created_at
            )
          )
        `)
        .eq('website_url', websiteUrl)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching comments:', error);
        throw error;
      }
      setComments(data || []);
      setError(''); // Clear any previous error
    } catch (err) {
      console.error('Error fetching comments:', err);
      if (err instanceof Error) {
        setError(`Failed to load comments: ${err.message}`);
      } else {
        setError('Failed to load comments: Unknown error');
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scraping_comments')
        .insert({
          user_id: user.id,
          website_url: websiteUrl,
          content: newComment.trim(),
        })
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [data, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scraping_comments')
        .insert({
          user_id: user.id,
          website_url: websiteUrl,
          content: replyContent.trim(),
          parent_id: parentId,
        })
        .select(`
          *,
          user:profiles!user_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Update the parent comment's replies
      setComments(prev => prev.map(comment =>
        comment.id === parentId
          ? { ...comment, replies: [...(comment.replies || []), data] }
          : comment
      ));

      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewComment(newComment + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const onReplyEmojiClick = (emojiObject: any) => {
    setReplyContent(replyContent + emojiObject.emoji);
    setShowReplyEmojiPicker(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Comments & Feedback</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <img
              src={getAvatarUrl(user.id)}
              alt="User avatar"
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-gray-900 text-sm">
                  {user.user_metadata?.name || 'Anonymous'}
                </span>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this website..."
                className="w-full px-3 py-2 bg-black text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <EmojiIcon className="w-4 h-4" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute z-10 mt-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={300}
                        height={400}
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                      />
                    </div>
                  )}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setNewComment(newComment + ' 😀')}
                    >
                      😀
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setNewComment(newComment + ' 👍')}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setNewComment(newComment + ' ❤️')}
                    >
                      ❤️
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setNewComment(newComment + ' 😂')}
                    >
                      😂
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setNewComment(newComment + ' 😢')}
                    >
                      😢
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600">Sign in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-3">
                <img
                  src={getAvatarUrl(comment.user?.id)}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.user?.name || 'Anonymous'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{comment.content}</p>

                  <div className="flex items-center gap-4 mb-3">
                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/comment/${comment.id}`)}
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                    >
                      <ShareIcon className="w-3 h-3" />
                      Share
                    </button>
                  </div>

                  {/* User Profile Section */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user?.name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Member since {new Date(comment.user?.created_at || comment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={getAvatarUrl(user.id)}
                          alt="User avatar"
                          className="w-6 h-6 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows={2}
                            disabled={loading}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                              >
                                <EmojiIcon className="w-3 h-3" />
                              </button>
                              {showReplyEmojiPicker && (
                                <div className="absolute z-10 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                                  <EmojiPicker
                                    onEmojiClick={onReplyEmojiClick}
                                    width={300}
                                    height={400}
                                    previewConfig={{ showPreview: false }}
                                    skinTonesDisabled
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1 text-gray-600 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={loading || !replyContent.trim()}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                              >
                                {loading ? 'Posting...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="pl-4 border-l-2 border-gray-200">
                          <div className="flex gap-3">
                            <img
                              src={getAvatarUrl(reply.user?.id)}
                              alt="User avatar"
                              className="w-6 h-6 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">
                                  {reply.user?.name || reply.user?.email || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
