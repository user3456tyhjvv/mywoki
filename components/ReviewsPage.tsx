import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChartBarIcon } from './Icons';

interface Review {
  id: number;
  name: string;
  message: string;
  rating: number;
  image_url: string;
  created_at: string;
  approved: boolean | null;
}

interface ReviewsPageProps {
  onNavigate: (route: string) => void;
}

export default function ReviewsPage({ onNavigate }: ReviewsPageProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Review form state
  const [revName, setRevName] = useState('');
  const [revMessage, setRevMessage] = useState('');
  const [revRating, setRevRating] = useState<number>(5);
  const [revImageUrl, setRevImageUrl] = useState('');
  const [revImageFile, setRevImageFile] = useState<File | null>(null);
  const [revImagePreview, setRevImagePreview] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRevImageFile(file);
      setRevImageUrl(''); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onload = (e) => {
        setRevImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRevImageUrl(url);
    setRevImageFile(null); // Clear file if URL is entered
    setRevImagePreview(url); // Show URL preview
  };



  /* -------------------------s
     Supabase: fetch approved reviews
     ------------------------- */
  async function fetchReviews() {
    setLoadingReviews(true);
    try {
      // only approved reviews are shown publicly
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error('Failed to load reviews', err.message || err);
    } finally {
      setLoadingReviews(false);
    }
  }

  /* -------------------------s
     Submit a new review (goes to Supabase)
     ------------------------- */
  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!revName.trim() || !revMessage.trim()) {
      setReviewError('Please provide your name and a message.');
      return;
    }
    if (revMessage.length < 10) {
      setReviewError('Message should be at least 10 characters.');
      return;
    }
    if (revRating < 1 || revRating > 5) {
      setReviewError('Please select a rating between 1 and 5.');
      return;
    }
    if (!revImageUrl.trim() && !revImageFile) {
      setReviewError('Please provide an image URL or upload an image.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = revImageUrl.trim();

      // If user uploaded a file, upload to Supabase Storage
      if (revImageFile) {
        const fileExt = revImageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(fileName, revImageFile);

        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('reviews').getPublicUrl(fileName).data.publicUrl;
      }

      // insert as approved so reviews appear immediately for public viewing
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          name: revName.trim(),
          message: revMessage.trim(),
          rating: revRating,
          image_url: imageUrl,
          user_id: user?.id ?? null,
          approved: true // auto-approve for public visibility
        });

      if (error) throw error;

      setReviewSuccess('Thanks — your review has been submitted and is now visible!');
      // clear fields
      setRevName('');
      setRevMessage('');
      setRevRating(5);
      setRevImageUrl('');
      setRevImageFile(null);
      // Refetch reviews to show the new one immediately
      fetchReviews();
    } catch (err: any) {
      console.error('Submit review failed', err.message || err);
      setReviewError('Failed to submit review — try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-sm bg-slate-900/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5">
              <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">mywoki</div>
              <div className="text-xs text-slate-400 -mt-1">Data-edge</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('/')} className="text-slate-300 hover:text-white">Home</button>
            <button onClick={() => onNavigate('/reviews')} className="text-slate-300 hover:text-white font-semibold">Reviews</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
                <button onClick={() => onNavigate('/welcome-portal')} className="px-4 py-2 rounded-lg bg-white/6 text-white hover:bg-white/10">Dashboard</button>
            ) : (
              <>
                <button onClick={() => onNavigate('/getting-started')} className="text-slate-300 hover:text-white">Sign In</button>
                <button onClick={() => onNavigate('/auth')} className="px-4 py-2 rounded-lg text-slate-900 bg-cyan-400 font-semibold shadow-md hover:opacity-95">Start Free Trial</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-20">
        <section className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">Customer Reviews</h1>
            <p className="text-slate-300 mt-2">Read what our users are saying and share your experience.</p>
          </div>

          {/* Submit Review Form */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 rounded-xl p-8 border border-slate-700 shadow-xl mb-12">
            <h2 className="text-2xl font-bold mb-6">Submit Your Review</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300">Your name</label>
                  <input value={revName} onChange={(e) => setRevName(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white" placeholder="John Doe" />
                </div>

                <div>
                  <label className="text-sm text-slate-300">Your rating</label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRevRating(n)}
                        className={`px-3 py-2 rounded-md ${revRating === n ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-300'}`}
                      >
                        {n} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-300">Message</label>
                  <textarea value={revMessage} onChange={(e) => setRevMessage(e.target.value)} rows={5} className="w-full mt-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white" placeholder="Tell us what you liked — and what could be better." />
                </div>

                <div>
                  <label className="text-sm text-slate-300">Image (URL or Upload)</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={revImageUrl}
                      onChange={handleUrlChange}
                      className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                    {(revImageUrl || revImagePreview) && (
                      <div className="mt-2">
                        <img
                          src={revImageUrl || revImagePreview || ''}
                          alt="Image preview"
                          className="w-32 h-32 object-cover rounded-lg border border-slate-600"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjNmM3NTdkIi8+Cjx0ZXh0IHg9IjY0IiB5PSI2NCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzlhYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zNWVtIj5JbnZhbGlkIFVSTDwvdGV4dD4KPHN2Zz4K';
                          }}
                        />
                      </div>
                    )}
                    <div className="text-center text-slate-400 text-sm">OR</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-900 hover:file:bg-cyan-400"
                    />
                  </div>
                </div>

                {reviewError && <div className="text-rose-400">{reviewError}</div>}
                {reviewSuccess && <div className="text-emerald-400">{reviewSuccess}</div>}

                <div className="flex gap-3">
                  <button disabled={submitting} type="submit" className="px-4 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button type="button" onClick={() => { setRevName(''); setRevMessage(''); setRevRating(5); setRevImageUrl(''); setRevImageFile(null); setRevImagePreview(null); setReviewError(null); setReviewSuccess(null); }} className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700">
                    Reset
                  </button>
                </div>

                <div className="text-xs text-slate-400">Reviews are submitted for approval and appear immediately after approval.</div>
              </form>

              {/* Live Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Live Preview</h3>
                <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {revImageUrl ? (
                        <img
                          src={revImageUrl}
                          alt="Preview avatar"
                          className="w-10 h-10 rounded-full object-cover border border-slate-600"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcgMjAgMjBaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                          <span className="text-slate-400 text-sm">?</span>
                        </div>
                      )}
                      <div className="font-semibold">{revName || 'Your Name'}</div>
                    </div>
                    <div className="text-sm text-slate-400">{new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="text-cyan-300 font-semibold mb-2">{'★'.repeat(revRating)}{'☆'.repeat(5 - revRating)}</div>
                  <div className="text-slate-300">{revMessage || 'Your review message will appear here...'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* All Reviews */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 rounded-xl p-8 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Reviews</h2>
              <div className="text-sm text-slate-400">Average rating: {(reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length)).toFixed(1)} ★</div>
            </div>

            {loadingReviews ? (
              <div className="text-slate-400">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-slate-400">No reviews yet — be the first to submit!</div>
            ) : (
              <div className="grid gap-6">
                {reviews.map((r) => (
                  <div key={r.id} className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-sm text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-cyan-300 font-semibold mb-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    <div className="text-slate-300 mb-4">{r.message}</div>
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={`${r.name}'s review image`}
                        className="w-full max-w-sm h-48 object-cover rounded-lg border border-slate-600"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
