'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ChartBarIcon, SparklesIcon, ShieldCheckIcon, UsersIcon, EnvelopeIcon, TrendingUpIcon, DownloadIcon, CopyIcon, ExternalLinkIcon, DocumentTextIcon, ChevronUpIcon } from './Icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import CommentSection from './CommentSection'
import TrackedWebsitesSidebar from './TrackedWebsitesSidebar'
import GoogleSignInPrompt from './GoogleSignInPrompt'
import ChatWidget from './ChatWidget'

interface ScrapedData {
  images: Array<{
    src: string
    alt?: string
    width?: number
    height?: number
    preview?: {
      size?: string
      type?: string
      available: boolean
    }
    downloadUrl: string
    filename: string
  }>
  videos: Array<{
    src: string
    type?: string
    poster?: string
    downloadUrl: string
    filename: string
  }>
  links: Array<{
    href: string
    text: string
    title?: string
    preview?: {
      domain: string
      isExternal: boolean
      favicon?: string
    }
  }>
  content: {
    title: string
    description: string
    h1: string[]
    h2: string[]
    paragraphs: string[]
    preview?: {
      summary: string
      wordCount: number
      readingTime: number
    }
  }
  ai?: {
    summary: string
    topics: string[]
    qualityScore: number
    suggestions: string[]
    insights: string[]
  }
}

interface ScrapingDashboardProps {
  onNavigate: (route: string) => void
}

const ScrapingDashboard: React.FC<ScrapingDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [domain, setDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'links' | 'content'>('images')
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [currentWebsite, setCurrentWebsite] = useState<string>('')

  // Show sign-in prompt for unauthenticated users after a delay
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowSignInPrompt(true)
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [user])

  // Save scraped website to tracked websites
  const saveTrackedWebsite = useCallback(async (url: string) => {
    if (!user) return

    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname

      const { error } = await supabase
        .from('tracked_websites')
        .upsert({
          user_id: user.id,
          url: url,
          domain: domain,
          last_scraped_at: new Date().toISOString(),
          scrape_count: 1
        }, {
          onConflict: 'user_id,url'
        })

      if (error) throw error

      // Update performance metrics
      await updateWebsitePerformance(url, scrapedData)
    } catch (err) {
      console.error('Error saving tracked website:', err)
    }
  }, [user, scrapedData])

  // Update website performance metrics
  const updateWebsitePerformance = useCallback(async (url: string, data: ScrapedData | null) => {
    if (!user || !data) return

    try {
      const { error } = await supabase
        .from('website_performance')
        .upsert({
          website_id: (await supabase
            .from('tracked_websites')
            .select('id')
            .eq('user_id', user.id)
            .eq('url', url)
            .single()).data?.id,
          images_count: data.images.length,
          videos_count: data.videos.length,
          links_count: data.links.length,
          content_length: data.content.paragraphs.join('').length + data.content.h1.join('').length + data.content.h2.join('').length,
          last_updated: new Date().toISOString()
        })

      if (error) throw error
    } catch (err) {
      console.error('Error updating performance:', err)
    }
  }, [user])

  const validateDomain = (domain: string): boolean => {
    if (!domain.trim()) return false
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`)
      return url.hostname.includes('.')
    } catch {
      return false
    }
  }
  const API_BACKEND = process.env.NODE_ENV === 'production' ? 'https://tooler-io.onrender.com' : 'http://localhost:3001'
  const handleScrape = useCallback(async () => {
    if (!domain.trim()) {
      setError('Please enter a domain')
      return
    }

    if (!validateDomain(domain)) {
      setError('Please enter a valid domain')
      return
    }

    setIsLoading(true)
    setError('')
    setScrapedData(null)
    setCurrentWebsite(domain)

    try {
      const response = await fetch(`${API_BACKEND}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ url: domain.startsWith('http') ? domain : `https://${domain}` }),
      })

      if (!response.ok) {
        throw new Error('Failed to scrape website')
      }

      const data = await response.json()
      setScrapedData(data)

      // Save to tracked websites if user is authenticated
      if (user) {
        await saveTrackedWebsite(domain)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [domain, user, saveTrackedWebsite])

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }, [])

  const handleCopyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [])

  const tabs = [
    { key: 'images' as const, label: 'Images', icon: DownloadIcon, count: scrapedData?.images.length || 0 },
    { key: 'videos' as const, label: 'Videos', icon: DownloadIcon, count: scrapedData?.videos.length || 0 },
    { key: 'links' as const, label: 'Links', icon: ExternalLinkIcon, count: scrapedData?.links.length || 0 },
    { key: 'content' as const, label: 'Content', icon: DocumentTextIcon, count: (scrapedData?.content.paragraphs?.length || 0) + (scrapedData?.content.h1?.length || 0) + (scrapedData?.content.h2?.length || 0) },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <TrackedWebsitesSidebar
        onSelectWebsite={(url) => {
          setDomain(url)
          setCurrentWebsite(url)
        }}
        currentWebsite={currentWebsite}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Web Scraping Dashboard</h1>
                  <p className="text-sm text-gray-600">AI-Powered Open Source Tool</p>
                </div>
              </div>
              {!user && (
                <button
                  onClick={() => setShowSignInPrompt(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <UsersIcon className="w-4 h-4" />
                  Sign In
                </button>
              )}
              <button
                onClick={() => onNavigate('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This tool is for educational and testing purposes only. Only scrape websites you own or have permission to access.
                  Respect robots.txt and terms of service. This tool does not guarantee complete or accurate results as it is in the testing phase and still in development.
                </p>
              </div>
            </div>
          </div>

          {/* Input Section - Made more prominent */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enter Website Domain</h2>
                <p className="text-sm text-gray-600">Start scraping by entering a website URL</p>
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g., example.com or https://example.com"
                className="flex-1 px-6 py-4 text-lg text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleScrape}
                disabled={isLoading || !domain.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Start Scraping
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          {scrapedData && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'images' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Images Found</h3>
                    {scrapedData.images.length === 0 ? (
                      <p className="text-gray-500">No images found</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scrapedData.images.map((image, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <img
                              src={image.src}
                              alt={image.alt || `Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded mb-3"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png'
                              }}
                            />
                            {image.preview && (
                              <div className="text-xs text-gray-500 mb-2">
                                {image.preview.size && <span>Size: {image.preview.size}</span>}
                                {image.preview.type && <span> | Type: {image.preview.type}</span>}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDownload(image.downloadUrl, image.filename)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <DownloadIcon className="w-3 h-3" />
                                Download
                              </button>
                              <button
                                onClick={() => handleCopyToClipboard(image.src)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                              >
                                <CopyIcon className="w-3 h-3" />
                                Copy URL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Videos Found</h3>
                    {scrapedData.videos.length === 0 ? (
                      <p className="text-gray-500">No videos found</p>
                    ) : (
                      <div className="space-y-3">
                        {scrapedData.videos.map((video, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-3 break-all">{video.src}</p>
                            {video.poster && (
                              <p className="text-xs text-gray-500 mb-2">Poster: {video.poster}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDownload(video.downloadUrl, video.filename)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <DownloadIcon className="w-3 h-3" />
                                Download
                              </button>
                              <button
                                onClick={() => handleCopyToClipboard(video.src)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                              >
                                <CopyIcon className="w-3 h-3" />
                                Copy URL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'links' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Links Found</h3>
                    {scrapedData.links.length === 0 ? (
                      <p className="text-gray-500">No links found</p>
                    ) : (
                      <div className="space-y-3">
                        {scrapedData.links.map((link, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-3 break-all">{link.href}</p>
                            {link.title && (
                              <p className="text-xs text-gray-500 mb-2">Title: {link.title}</p>
                            )}
                            {link.preview && (
                              <div className="text-xs text-gray-500 mb-2">
                                <span>Domain: {link.preview.domain}</span>
                                {link.preview.isExternal && <span> (External)</span>}
                              </div>
                            )}
                            <button
                              onClick={() => handleCopyToClipboard(link.href)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              <CopyIcon className="w-3 h-3" />
                              Copy Link
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Content Extracted</h3>
                    <div className="space-y-4">
                      {scrapedData.content.title && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                          <p className="text-sm text-gray-700 mb-3">{scrapedData.content.title}</p>
                          <button
                            onClick={() => handleCopyToClipboard(scrapedData.content.title)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <CopyIcon className="w-3 h-3" />
                            Copy Text
                          </button>
                        </div>
                      )}
                      {scrapedData.content.description && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-700 mb-3">{scrapedData.content.description}</p>
                          <button
                            onClick={() => handleCopyToClipboard(scrapedData.content.description)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <CopyIcon className="w-3 h-3" />
                            Copy Text
                          </button>
                        </div>
                      )}
                      {scrapedData.content.h1.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">H1 Headings</h4>
                          <div className="space-y-2">
                            {scrapedData.content.h1.map((heading, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">{heading}</p>
                                <button
                                  onClick={() => handleCopyToClipboard(heading)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                >
                                  <CopyIcon className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {scrapedData.content.h2.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">H2 Headings</h4>
                          <div className="space-y-2">
                            {scrapedData.content.h2.map((heading, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">{heading}</p>
                                <button
                                  onClick={() => handleCopyToClipboard(heading)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                >
                                  <CopyIcon className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {scrapedData.content.paragraphs.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Paragraphs</h4>
                          <div className="space-y-2">
                            {scrapedData.content.paragraphs.map((paragraph, index) => (
                              <div key={index} className="flex items-start justify-between">
                                <p className="text-sm text-gray-700 flex-1 mr-2">{paragraph}</p>
                                <button
                                  onClick={() => handleCopyToClipboard(paragraph)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 flex-shrink-0"
                                >
                                  <CopyIcon className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {scrapedData.content.preview && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Content Preview</h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Summary:</strong> {scrapedData.content.preview.summary}</p>
                            <p><strong>Word Count:</strong> {scrapedData.content.preview.wordCount}</p>
                            <p><strong>Reading Time:</strong> {scrapedData.content.preview.readingTime} minutes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment Section */}
          {currentWebsite && (
            <CommentSection websiteUrl={currentWebsite} />
          )}
        </main>

        {/* Chat Widget */}
        <ChatWidget />

        {/* Google Sign-In Prompt */}
        <GoogleSignInPrompt
          isVisible={showSignInPrompt}
          onClose={() => setShowSignInPrompt(false)}
        />
      </div>
    </div>
  )
}

export default ScrapingDashboard
