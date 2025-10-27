import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeftIcon, SparklesIcon, DocumentTextIcon, CogIcon, PlayIcon, DownloadIcon, EditIcon, PlusIcon, TrashIcon, TranslateIcon } from './Icons';
import { getAISuggestions } from '../services/geminiService';
import ChatWidget from './ChatWidget';

interface DesignDashboardProps {
  onBack: () => void;
}

interface GeneratedTemplate {
  id: string;
  name: string;
  content: string;
  platform: string;
  createdAt: Date;
  thumbnail?: string;
  pages: TemplatePage[];
}

interface TemplatePage {
  id: string;
  name: string;
  content: string;
  elements: TemplateElement[];
}

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'button' | 'icon' | 'layout';
  content: string;
  styles: string;
}

const DesignDashboard: React.FC<DesignDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [request, setRequest] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('wordpress');
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'instructions' | 'education'>('generate');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [editingTemplate, setEditingTemplate] = useState<GeneratedTemplate | null>(null);
  const [newPageName, setNewPageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateOptions = [
    { value: 'wordpress', label: 'WordPress', icon: '📝', color: 'from-blue-500 to-blue-600' },
    { value: 'framer', label: 'Framer', icon: '🎨', color: 'from-purple-500 to-pink-500' },
    { value: 'squarespace', label: 'Squarespace', icon: '⬜', color: 'from-black to-gray-700' },
    { value: 'wix', label: 'Wix', icon: '🛠️', color: 'from-orange-500 to-red-500' },
    { value: 'woocommerce', label: 'WooCommerce', icon: '🛒', color: 'from-green-500 to-blue-500' },
  ];

  const languages = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'spanish', label: 'Español', flag: '🇪🇸' },
    { value: 'chinese', label: '中文', flag: '🇨🇳' },
    { value: 'french', label: 'Français', flag: '🇫🇷' },
    { value: 'german', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'arabic', label: 'العربية', flag: '🇸🇦' },
  ];

  const educationVideos = [
    {
      id: 1,
      title: 'WordPress Website Building Masterclass',
      duration: '15:30',
      platform: 'wordpress',
      thumbnail: '📺'
    },
    {
      id: 2,
      title: 'Framer Design for Beginners',
      duration: '12:45',
      platform: 'framer',
      thumbnail: '🎬'
    },
    {
      id: 3,
      title: 'Squarespace Template Customization',
      duration: '18:20',
      platform: 'squarespace',
      thumbnail: '📹'
    },
    {
      id: 4,
      title: 'Wix Editor Deep Dive',
      duration: '22:10',
      platform: 'wix',
      thumbnail: '🎥'
    },
    {
      id: 5,
      title: 'WooCommerce Store Setup',
      duration: '25:40',
      platform: 'woocommerce',
      thumbnail: '📼'
    }
  ];

  const getPlatformInstructions = (platform: string, language: string) => {
    const instructions: { [key: string]: { [key: string]: string[] } } = {
      wordpress: {
        english: [
          "1. Log in to your WordPress admin dashboard",
          "2. Go to Appearance → Themes → Add New",
          "3. Upload the generated template ZIP file",
          "4. Activate the theme",
          "5. Customize via Appearance → Customize",
          "6. Add content through Pages and Posts",
          "7. Install recommended plugins for full functionality"
        ],
        spanish: [
          "1. Inicia sesión en tu panel de administración de WordPress",
          "2. Ve a Apariencia → Temas → Añadir nuevo",
          "3. Sube el archivo ZIP de la plantilla generada",
          "4. Activa el tema",
          "5. Personaliza a través de Apariencia → Personalizar",
          "6. Añade contenido mediante Páginas y Entradas",
          "7. Instala los plugins recomendados para toda la funcionalidad"
        ],
        chinese: [
          "1. 登录您的WordPress管理仪表板",
          "2. 转到外观 → 主题 → 添加新主题",
          "3. 上传生成的模板ZIP文件",
          "4. 激活主题",
          "5. 通过外观 → 自定义进行个性化设置",
          "6. 通过页面和文章添加内容",
          "7. 安装推荐插件以获得完整功能"
        ]
      },
      framer: {
        english: [
          "1. Create a new Framer project",
          "2. Copy the generated HTML/CSS code",
          "3. Paste into Framer's code component",
          "4. Adjust breakpoints for responsiveness",
          "5. Connect interactions and animations",
          "6. Test on multiple devices",
          "7. Publish and share your site"
        ],
        spanish: [
          "1. Crea un nuevo proyecto en Framer",
          "2. Copia el código HTML/CSS generado",
          "3. Pega en el componente de código de Framer",
          "4. Ajusta los breakpoints para responsividad",
          "5. Conecta interacciones y animaciones",
          "6. Prueba en múltiples dispositivos",
          "7. Publica y comparte tu sitio"
        ],
        chinese: [
          "1. 创建一个新的Framer项目",
          "2. 复制生成的HTML/CSS代码",
          "3. 粘贴到Framer的代码组件中",
          "4. 调整断点以实现响应式设计",
          "5. 连接交互和动画",
          "6. 在多个设备上测试",
          "7. 发布并分享您的网站"
        ]
      }
    };

    return instructions[platform]?.[language] || instructions[platform]?.english || [];
  };

  const handleGenerate = async () => {
    if (!request.trim()) {
      setError('Please describe what you want to create with KIT.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const prompt = `As KIT AI Design Assistant, generate a complete ${selectedTemplate} template for: "${request}". 
      Provide:
      1. Complete HTML/CSS/JS code structure
      2. Responsive design considerations
      3. Modern UI/UX best practices
      4. Platform-specific optimizations for ${selectedTemplate}
      5. Placeholder content and images
      6. Styling guidelines
      7. Implementation notes`;

      const response = await getAISuggestions({ request, template: selectedTemplate }, 'design-kit');
      
      const newTemplate: GeneratedTemplate = {
        id: Date.now().toString(),
        name: `${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template ${generatedTemplates.length + 1}`,
        content: response.recommendations?.join('\n\n') || 'Template generation complete. Start editing your design!',
        platform: selectedTemplate,
        createdAt: new Date(),
        pages: [
          {
            id: '1',
            name: 'Home',
            content: 'Home page content',
            elements: [
              { id: '1', type: 'text', content: 'Welcome to your new website', styles: 'font-size: 2rem; color: #333;' },
              { id: '2', type: 'button', content: 'Get Started', styles: 'background: #007bff; color: white; padding: 10px 20px;' }
            ]
          }
        ]
      };

      setGeneratedTemplates(prev => [newTemplate, ...prev]);
      setSelectedTemplateId(newTemplate.id);
      setEditingTemplate(newTemplate);
      setActiveTab('edit');
      setRequest('');
    } catch (err) {
      setError('KIT is busy designing! Please try again in a moment.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddPage = () => {
    if (!editingTemplate || !newPageName.trim()) return;

    const newPage: TemplatePage = {
      id: Date.now().toString(),
      name: newPageName,
      content: '',
      elements: []
    };

    setEditingTemplate(prev => prev ? {
      ...prev,
      pages: [...prev.pages, newPage]
    } : null);

    setNewPageName('');
  };

  const handleAddElement = (type: TemplateElement['type']) => {
    if (!editingTemplate) return;

    const newElement: TemplateElement = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'New text element' : '',
      styles: 'color: #333; font-size: 16px;'
    };

    setEditingTemplate(prev => prev ? {
      ...prev,
      pages: prev.pages.map(page => 
        page.id === editingTemplate.pages[0].id 
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    } : null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingTemplate) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newElement: TemplateElement = {
          id: Date.now().toString(),
          type: 'image',
          content: e.target?.result as string,
          styles: 'max-width: 100%; height: auto;'
        };

        setEditingTemplate(prev => prev ? {
          ...prev,
          pages: prev.pages.map(page => 
            page.id === editingTemplate.pages[0].id 
              ? { ...page, elements: [...page.elements, newElement] }
              : page
          )
        } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElementContent = (elementId: string, content: string) => {
    if (!editingTemplate) return;

    setEditingTemplate(prev => prev ? {
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => 
          el.id === elementId ? { ...el, content } : el
        )
      }))
    } : null);
  };

  const handleDownloadTemplate = () => {
    if (!editingTemplate) return;

    const templateData = {
      ...editingTemplate,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editingTemplate.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedTemplateData = generatedTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'theme-bg-gradient' : 'theme-bg-primary'} theme-text-primary flex flex-col p-4 font-sans`}>
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto mb-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 theme-text-secondary hover:theme-text-primary theme-hover-bg rounded-lg transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-brand-accent" />
              <div className="text-2xl font-bold">KIT Design Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm theme-text-secondary">
              Premium Design Suite
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b theme-border-primary mb-8">
          {[
            { id: 'generate', label: 'Generate with KIT', icon: SparklesIcon },
            { id: 'edit', label: 'Edit Template', icon: EditIcon },
            { id: 'instructions', label: 'KIT Instructions', icon: DocumentTextIcon },
            { id: 'education', label: 'Learning Hub', icon: PlayIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-accent text-brand-accent font-semibold'
                  : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl p-6 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'}`}>
              <h3 className="font-semibold mb-4">Your Templates</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setEditingTemplate(template);
                      setActiveTab('edit');
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'bg-brand-accent/20 border border-brand-accent/30'
                        : 'theme-hover-bg'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">
                        {templateOptions.find(t => t.value === template.platform)?.icon}
                      </span>
                      <div className="font-medium text-sm truncate">{template.name}</div>
                    </div>
                    <div className="text-xs theme-text-secondary">
                      {template.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {generatedTemplates.length === 0 && (
                  <div className="text-center py-8 theme-text-secondary">
                    <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No templates yet</div>
                    <div className="text-xs">Generate your first design with KIT</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <div className={`rounded-2xl p-8 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'}`}>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-4">
                    Design with <span className="text-brand-accent">KIT AI</span>
                  </h1>
                  <p className="theme-text-secondary text-lg">
                    Describe your vision and let KIT create stunning templates for your chosen platform
                  </p>
                </div>

                {/* Template Platform Selection */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {templateOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTemplate(option.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedTemplate === option.value
                          ? `border-brand-accent bg-gradient-to-r ${option.color} text-white shadow-lg`
                          : `${resolvedTheme === 'dark' ? 'bg-slate-800/70 border-slate-600' : 'theme-card-bg theme-border-primary'} hover:border-brand-accent`
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>

                {/* Design Input */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Describe Your Design Needs
                    </label>
                    <textarea
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      placeholder="Example: 'Create a modern e-commerce website for handmade jewelry with product gallery, about section, and contact form. Use soft colors and elegant typography.'"
                      className={`w-full px-4 py-3 h-32 ${resolvedTheme === 'dark' ? 'bg-slate-800/70 border-slate-600' : 'theme-card-bg theme-border-primary'} border-2 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent focus:outline-none transition-all duration-300 resize-none ${resolvedTheme === 'dark' ? 'placeholder-slate-400' : 'placeholder-gray-500'}`}
                      disabled={isGenerating}
                    />
                    {error && (
                      <p className="text-red-400 mt-2 text-sm">{error}</p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !request.trim()}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-purple-500/30"
                  >
                    {isGenerating ? (
                      <>
                        <CogIcon className="w-5 h-5 animate-spin" />
                        <span>KIT is Designing Your Template...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        <span>Generate with KIT AI ($49 Value)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Tab */}
            {activeTab === 'edit' && editingTemplate && (
              <div className="space-y-6">
                {/* Template Header */}
                <div className={`rounded-2xl p-6 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{editingTemplate.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span>{templateOptions.find(t => t.value === editingTemplate.platform)?.icon}</span>
                        <span className="theme-text-secondary capitalize">{editingTemplate.platform} Template</span>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Export Template
                    </button>
                  </div>
                </div>

                {/* Editing Interface */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Elements Panel */}
                  <div className={`rounded-2xl p-6 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'} xl:col-span-1`}>
                    <h3 className="font-semibold mb-4">Add Elements</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { type: 'text' as const, label: 'Text', icon: '📝' },
                        { type: 'image' as const, label: 'Image', icon: '🖼️' },
                        { type: 'video' as const, label: 'Video', icon: '🎥' },
                        { type: 'button' as const, label: 'Button', icon: '🔘' },
                        { type: 'icon' as const, label: 'Icon', icon: '⭐' },
                        { type: 'layout' as const, label: 'Layout', icon: '📐' }
                      ].map((element) => (
                        <button
                          key={element.type}
                          onClick={() => handleAddElement(element.type)}
                          className="flex flex-col items-center gap-2 p-3 theme-hover-bg rounded-lg border theme-border-primary transition-colors"
                        >
                          <span className="text-xl">{element.icon}</span>
                          <span className="text-xs">{element.label}</span>
                        </button>
                      ))}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed theme-border-primary rounded-lg hover:border-brand-accent transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Upload Image/Video
                    </button>

                    {/* Pages Management */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Pages</h4>
                      <div className="space-y-2">
                        {editingTemplate.pages.map((page) => (
                          <div key={page.id} className="flex items-center justify-between p-2 theme-hover-bg rounded">
                            <span>{page.name}</span>
                            <button className="text-red-400 hover:text-red-300">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={newPageName}
                          onChange={(e) => setNewPageName(e.target.value)}
                          placeholder="New page name"
                          className="flex-1 px-3 py-1 border theme-border-primary rounded text-sm"
                        />
                        <button
                          onClick={handleAddPage}
                          className="px-3 py-1 bg-brand-accent text-white rounded text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Panel */}
                  <div className={`rounded-2xl p-6 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'} xl:col-span-2`}>
                    <h3 className="font-semibold mb-4">Live Preview</h3>
                    <div className="border-2 theme-border-primary rounded-lg p-4 min-h-96 bg-white/10">
                      {editingTemplate.pages[0]?.elements.map((element) => (
                        <div key={element.id} className="mb-3 p-2 border theme-border-primary rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm capitalize">{element.type}</span>
                            <button className="text-red-400 hover:text-red-300">
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                          {element.type === 'text' && (
                            <textarea
                              value={element.content}
                              onChange={(e) => updateElementContent(element.id, e.target.value)}
                              className="w-full p-2 border theme-border-primary rounded text-sm"
                              rows={3}
                            />
                          )}
                          {element.type === 'image' && element.content && (
                            <div className="text-center">
                              <img 
                                src={element.content} 
                                alt="Uploaded" 
                                className="max-w-full h-32 object-cover mx-auto rounded"
                              />
                            </div>
                          )}
                          {element.type === 'button' && (
                            <button className="px-4 py-2 bg-blue-500 text-white rounded">
                              {element.content || 'Button'}
                            </button>
                          )}
                        </div>
                      ))}
                      {editingTemplate.pages[0]?.elements.length === 0 && (
                        <div className="text-center py-16 theme-text-secondary">
                          <EditIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <div>Add elements to start building your template</div>
                          <div className="text-sm">Use the panel on the left to add text, images, and more</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className={`rounded-2xl p-8 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">KIT Instructions</h2>
                  <div className="flex items-center gap-2">
                    <TranslateIcon className="w-4 h-4" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-3 py-1 border theme-border-primary rounded bg-transparent"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templateOptions.map((platform) => (
                    <div key={platform.value} className={`rounded-xl p-6 border ${resolvedTheme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'theme-card-bg theme-border-primary'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{platform.icon}</span>
                        <h3 className="text-lg font-semibold">{platform.label} Setup Guide</h3>
                      </div>
                      <div className="space-y-2">
                        {getPlatformInstructions(platform.value, selectedLanguage).map((step, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 rounded theme-hover-bg">
                            <div className="w-6 h-6 bg-brand-accent rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="text-sm">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className={`rounded-2xl p-8 backdrop-blur-sm border ${resolvedTheme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'theme-card-bg theme-border-primary'}`}>
                <h2 className="text-2xl font-bold mb-6">Learning Hub</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {educationVideos.map((video) => (
                    <div key={video.id} className={`rounded-xl p-4 border ${resolvedTheme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'theme-card-bg theme-border-primary'} cursor-pointer hover:scale-105 transition-transform`}>
                      <div className="text-4xl text-center mb-3">{video.thumbnail}</div>
                      <h3 className="font-semibold mb-2">{video.title}</h3>
                      <div className="flex justify-between items-center text-sm theme-text-secondary">
                        <span>{templateOptions.find(t => t.value === video.platform)?.label}</span>
                        <span>⏱️ {video.duration}</span>
                      </div>
                      <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/80 transition-colors">
                        <PlayIcon className="w-4 h-4" />
                        Watch Tutorial
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <h3 className="text-xl font-semibold mb-2">Premium Web Design Course</h3>
                  <p className="theme-text-secondary mb-4">
                    Master website building with our comprehensive video course. Learn advanced techniques for all platforms.
                  </p>
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
                    Enroll in Full Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Chat Widget for Support */}
      <ChatWidget />

      {/* Premium Badge */}
      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg font-semibold">
        💎 Premium Plan - $49/month
      </div>
    </div>
  );
};

export default DesignDashboard;