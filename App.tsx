import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText, AlertCircle, Loader2, LogOut, Lock, User, CheckCircle2, ShieldCheck } from 'lucide-react';
import { InputField } from './components/InputField';
import { ImageUploader } from './components/ImageUploader';
import { ObserverData } from './types';

const App: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- App State ---
  const [data, setData] = useState<ObserverData>({
    candidateName: '',
    candidateDistrict: '',
    observerName: '',
    nationalId: '',
    phone: '',
    voterCardNumber: '',
    address: '',
    schoolName: '',
    nationalCardFront: null,
    nationalCardBack: null,
    voterCardFront: null,
    voterCardBack: null,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const pledgeRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<HTMLDivElement>(null);

  // --- Login Handler ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'ghaith' && password === 'ghaith') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    // Optional: Reset data
  };

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (key: keyof ObserverData) => (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setData(prev => ({ ...prev, [key]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (key: keyof ObserverData) => () => {
    setData(prev => ({ ...prev, [key]: null }));
  };

  const initiateExport = () => {
    if (!data.candidateName || !data.observerName) {
      alert("يرجى ملء الحقول الأساسية (المرشح والمراقب) على الأقل.");
      return;
    }
    setShowConfirmModal(true);
  };

  // --- PDF Generation Logic ---
  const generatePDF = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const captureElement = async (element: HTMLElement) => {
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '210mm'; 
        clone.style.zIndex = '-9999';
        clone.style.background = '#ffffff';
        clone.style.pointerEvents = 'none';
        
        document.body.appendChild(clone);

        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: 1000,
          });
          return canvas.toDataURL('image/jpeg', 0.90);
        } finally {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone);
          }
        }
      };

      if (pledgeRef.current) {
        const imgData1 = await captureElement(pledgeRef.current);
        doc.addImage(imgData1, 'JPEG', 0, 0, 210, 297);
      } else {
        throw new Error("تعذر العثور على عنصر التعهد");
      }

      if (attachmentsRef.current) {
        doc.addPage();
        const imgData2 = await captureElement(attachmentsRef.current);
        doc.addImage(imgData2, 'JPEG', 0, 0, 210, 297);
      }

      const cleanName = data.observerName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').replace(/\s+/g, '_');
      doc.save(`تعهد_${cleanName || 'مراقب'}.pdf`);
      
      setShowConfirmModal(false);

    } catch (error: any) {
      console.error("PDF Generation failed", error);
      alert(`عذراً، فشل تصدير الملف.\nالسبب: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 font-sans p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/20 p-4 rounded-full border border-blue-500/30 shadow-inner">
              <ShieldCheck className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-white mb-2">تسجيل الدخول</h2>
          <p className="text-center text-blue-200 mb-8 text-sm">منصة إدارة تعهدات المراقبين الانتخابية</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-blue-100 mr-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-blue-100 mr-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-300 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              دخول للنظام
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APPLICATION ---
  return (
    <div className="min-h-screen pb-10 font-sans relative bg-slate-50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none fixed"></div>

      {/* Modern Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">منصة تعهدات المراقبين</h1>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                نظام إدارة الحملة الانتخابية
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-700">المستخدم: {username}</span>
              <span className="text-xs text-slate-400">مدير النظام</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors"
              title="تسجيل خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button 
              onClick={initiateExport}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                isGenerating 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-xl active:scale-95'
              }`}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>تصدير PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 mt-8 flex flex-col xl:flex-row gap-8 relative z-10">
        
        {/* RIGHT COLUMN: Input Forms */}
        <div className="w-full xl:w-4/12 space-y-6">
          
          {/* Section 1: Candidate Info */}
          <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-blue-200 transition-all duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><User className="w-5 h-5" /></span>
              معلومات الطرف الأول (المرشح)
            </h2>
            <div className="space-y-4">
              <InputField 
                label="اسم المرشح" 
                name="candidateName" 
                value={data.candidateName} 
                onChange={handleChange} 
                required 
                placeholder="الاسم الكامل للمرشح"
              />
              <InputField 
                label="الدائرة الانتخابية / المحافظة" 
                name="candidateDistrict" 
                value={data.candidateDistrict} 
                onChange={handleChange} 
                placeholder="مثال: بغداد - الدائرة الأولى"
              />
            </div>
          </div>

          {/* Section 2: Observer Info */}
          <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-green-200 transition-all duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="bg-green-100 text-green-700 p-1.5 rounded-lg"><ShieldCheck className="w-5 h-5" /></span>
              معلومات الطرف الثاني (المراقب)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField 
                  label="الاسم الكامل" 
                  name="observerName" 
                  value={data.observerName} 
                  onChange={handleChange} 
                  required 
                  placeholder="اسم المراقب الثلاثي"
                />
              </div>
              <InputField 
                label="رقم الهوية" 
                name="nationalId" 
                value={data.nationalId} 
                onChange={handleChange} 
              />
              <InputField 
                label="رقم الهاتف" 
                name="phone" 
                type="tel"
                value={data.phone} 
                onChange={handleChange} 
              />
              <InputField 
                label="رقم بطاقة الناخب" 
                name="voterCardNumber" 
                value={data.voterCardNumber} 
                onChange={handleChange} 
              />
              <InputField 
                label="السكن / الحي" 
                name="address" 
                value={data.address} 
                onChange={handleChange} 
              />
              <div className="md:col-span-2">
                <InputField 
                  label="اسم المدرسة (مركز الاقتراع)" 
                  name="schoolName" 
                  value={data.schoolName} 
                  onChange={handleChange} 
                  placeholder="اسم المركز الانتخابي"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Document Uploads */}
          <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-purple-200 transition-all duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="bg-purple-100 text-purple-700 p-1.5 rounded-lg"><FileText className="w-5 h-5" /></span>
              المستمسكات (المرفقات)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploader 
                id="nat_front"
                label="الوطنية (وجه)" 
                imageSrc={data.nationalCardFront} 
                onUpload={handleImageUpload('nationalCardFront')} 
                onRemove={handleImageRemove('nationalCardFront')}
              />
              <ImageUploader 
                id="nat_back"
                label="الوطنية (ظهر)" 
                imageSrc={data.nationalCardBack} 
                onUpload={handleImageUpload('nationalCardBack')} 
                onRemove={handleImageRemove('nationalCardBack')}
              />
              <ImageUploader 
                id="vot_front"
                label="الناخب (وجه)" 
                imageSrc={data.voterCardFront} 
                onUpload={handleImageUpload('voterCardFront')} 
                onRemove={handleImageRemove('voterCardFront')}
              />
              <ImageUploader 
                id="vot_back"
                label="الناخب (ظهر)" 
                imageSrc={data.voterCardBack} 
                onUpload={handleImageUpload('voterCardBack')} 
                onRemove={handleImageRemove('voterCardBack')}
              />
            </div>
          </div>

        </div>

        {/* LEFT COLUMN: Live Preview */}
        <div className="w-full xl:w-8/12">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <CheckCircle2 className="w-6 h-6 text-green-600" />
                 معاينة التعهد الرسمي
              </h2>
              <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold border border-slate-300">
                A4 قياسي
              </span>
            </div>

            {/* The Pledge Container Preview Window */}
            <div className="overflow-hidden rounded-xl shadow-2xl border border-slate-300 bg-slate-300/50 backdrop-blur-sm p-4 lg:p-8 flex justify-center">
              
              {/* Actual A4 Content to be captured */}
              <div 
                ref={pledgeRef}
                className="bg-white shadow-xl text-black relative mx-auto transform transition-transform origin-top"
                style={{
                  width: '210mm', 
                  minHeight: '297mm', 
                  padding: '20mm',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'Tajawal, sans-serif'
                }}
              >
                {/* Decorative Frame */}
                <div className="absolute inset-0 border-[3px] border-double border-slate-800 m-4 pointer-events-none"></div>
                <div className="absolute inset-0 border border-slate-400 m-5 pointer-events-none"></div>

                {/* Document Header */}
                <div className="text-center mb-8 pb-4 relative">
                   <div className="inline-block border-b-2 border-black pb-2 px-8">
                      <h1 className="text-2xl font-black mb-1">تعهد مراقب كيان سياسي</h1>
                      <p className="text-sm text-gray-600">انتخابات مجالس المحافظات / مجلس النواب</p>
                   </div>
                </div>

                {/* Party 1 */}
                <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                  <h3 className="font-bold text-lg mb-3 border-b border-slate-300 pb-1 text-slate-900">الطرف الأول (المرشح):</h3>
                  <div className="grid grid-cols-1 gap-1">
                    <p className="flex"><span className="w-24 font-bold text-slate-700">الاسم:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.candidateName || ''}</span></p>
                    <p className="flex"><span className="w-24 font-bold text-slate-700">الترشيح عن:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.candidateDistrict || ''}</span></p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">* ويُشار إليه لاحقًا بـ "المرشح".</p>
                </div>

                {/* Party 2 */}
                <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                  <h3 className="font-bold text-lg mb-3 border-b border-slate-300 pb-1 text-slate-900">الطرف الثاني (المراقب):</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <p className="flex col-span-2"><span className="w-32 font-bold text-slate-700">الاسم الكامل:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.observerName || ''}</span></p>
                    <p className="flex"><span className="w-32 font-bold text-slate-700">رقم الهوية:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.nationalId || ''}</span></p>
                    <p className="flex"><span className="w-32 font-bold text-slate-700">رقم الهاتف:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.phone || ''}</span></p>
                    <p className="flex"><span className="w-32 font-bold text-slate-700">رقم بطاقة الناخب:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.voterCardNumber || ''}</span></p>
                    <p className="flex"><span className="w-32 font-bold text-slate-700">السكن/الحي:</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.address || ''}</span></p>
                    <p className="flex col-span-2"><span className="w-32 font-bold text-slate-700">المدرسة (المركز):</span> <span className="font-bold text-black border-b border-dotted border-black flex-1">{data.schoolName || ''}</span></p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">* ويُشار إليه لاحقًا بـ "المراقب".</p>
                </div>

                {/* Introduction */}
                <div className="mb-5 text-justify leading-relaxed text-sm">
                  <h3 className="font-bold mb-1 text-black">مقدمة:</h3>
                  <p>نظرًا للحاجة إلى مراقبين يمثلون المرشح داخل مراكز ومحطات الاقتراع، فقد جرى الاتفاق على أن يعمل المراقب لصالح المرشح، وأن يلتزم بجميع التعليمات والقوانين الخاصة بالمفوضية العليا المستقلة للانتخابات، وبكافة التوجيهات الصادرة عن المرشح أو مدير حملته.</p>
                  <p className="mt-1 font-semibold">وبموجب هذا التعهد يقرّ المراقب بأنه سيمتثل لجميع التعليمات والضوابط المذكورة أدناه:</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Section 1 */}
                    <div className="mb-2 col-span-2">
                      <h3 className="font-bold text-black border-b border-gray-300 mb-1">أولاً: مهام ومسؤوليات المراقب</h3>
                      <ul className="list-disc list-inside text-xs space-y-1 text-gray-800 pr-2">
                        <li>التواجد في المركز أو المحطة المحددة للمرشح طوال فترة الاقتراع.</li>
                        <li>متابعة سير العملية الانتخابية والتأكد من تطبيق إجراءات المفوضية بشكل صحيح.</li>
                        <li>توثيق أي خروقات أو مخالفات تؤثر على نزاهة التصويت ورفعها للمرشح.</li>
                        <li>عدم التأثير على الناخبين أو توجيههم أو الحديث معهم بشأن التصويت.</li>
                        <li>الحفاظ على الحياد التام داخل المركز وعدم افتعال أي مشاكل.</li>
                        <li>تصوير النتائج النهائية للمحطة (شريط النتائج) وإرسالها للمرشح فوراً.</li>
                        <li>الالتزام بعدم مغادرة المحطة إلا بعد إخطار مسؤول الحملة.</li>
                      </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="mb-2">
                      <h3 className="font-bold text-black border-b border-gray-300 mb-1">ثانياً: التزامات المراقب</h3>
                      <ul className="list-disc list-inside text-xs space-y-1 text-gray-800 pr-2">
                        <li>الالتزام بجميع تعليمات المرشح.</li>
                        <li>العمل بأمانة ونزاهة تامة.</li>
                        <li>عدم نشر النتائج على التواصل الاجتماعي.</li>
                        <li>السرية التامة للمعلومات.</li>
                      </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="mb-2">
                      <h3 className="font-bold text-black border-b border-gray-300 mb-1">ثالثاً: التزامات المرشح</h3>
                      <ul className="list-disc list-inside text-xs space-y-1 text-gray-800 pr-2">
                        <li>توفير باج المراقبة الرسمي.</li>
                        <li>تزويد المراقب بدليل العمل.</li>
                        <li>توفير وسيلة اتصال مباشرة.</li>
                      </ul>
                    </div>
                </div>

                {/* Section 4 & 5 */}
                <div className="mt-3 mb-4 bg-red-50 p-3 rounded border border-red-100">
                  <h3 className="font-bold text-red-900 text-sm">رابعاً: التعهد القانوني والعقوبات</h3>
                  <p className="text-xs text-red-800 mt-1 text-justify">
                    يتعهد المراقب بعدم كشف أي معلومات لغير المخولين وعدم تسريب النتائج. وفي حال الإخلال بأي بند، يتحمل المسؤولية القانونية الكاملة، ويحق للمرشح إلغاء اعتماده فوراً واتخاذ الإجراءات القانونية اللازمة في حال ثبوت الضرر.
                  </p>
                </div>

                {/* Signatures */}
                <div className="mt-auto pt-6">
                  <div className="flex justify-between items-end gap-8">
                    <div className="w-1/2 text-center">
                      <p className="font-bold mb-4 text-sm">توقيع المرشح (أو المخول)</p>
                      <div className="h-16 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-xl">
                        {data.candidateName ? data.candidateName.split(' ')[0] : ''}
                      </div>
                      <p className="text-xs">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="w-1/2 text-center">
                      <p className="font-bold mb-4 text-sm">توقيع وبصمة المراقب</p>
                      <div className="h-16 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-xl bg-slate-50/50">
                         {/* Space for thumbprint */}
                      </div>
                      <p className="text-xs">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HIDDEN TEMPLATES FOR PDF GENERATION --- */}
      <div className="fixed left-[-10000px] top-0 pointer-events-none">
        
        {/* Page 2: Attachments Template */}
        <div 
          ref={attachmentsRef}
          className="bg-white relative flex flex-col items-center"
          dir="rtl"
          style={{
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            boxSizing: 'border-box',
            fontFamily: 'Tajawal, sans-serif'
          }}
        >
          {/* Decorative Header for Attachments */}
          <div className="w-full text-center border-b-4 border-double border-slate-800 pb-6 mb-10">
             <h1 className="text-4xl font-black text-slate-900 mb-2">المستمسكات والمرفقات</h1>
             <div className="flex justify-center items-center gap-2 text-xl text-slate-600">
                <span className="font-bold">اسم المراقب:</span>
                <span className="border-b-2 border-slate-400 px-4 min-w-[200px]">{data.observerName}</span>
             </div>
          </div>

          <div className="w-full flex flex-col gap-12 flex-1">
            
            {/* National ID Row */}
            <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold text-slate-800">البطاقة الوطنية الموحدة</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="bg-white border-2 border-slate-300 rounded-xl h-64 overflow-hidden shadow-sm flex items-center justify-center relative">
                    <span className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">الوجه</span>
                    {data.nationalCardFront ? (
                      <img src={data.nationalCardFront} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-300 font-bold text-lg">لا توجد صورة</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-white border-2 border-slate-300 rounded-xl h-64 overflow-hidden shadow-sm flex items-center justify-center relative">
                    <span className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">الظهر</span>
                    {data.nationalCardBack ? (
                      <img src={data.nationalCardBack} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-300 font-bold text-lg">لا توجد صورة</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Voter Card Row */}
            <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <h2 className="text-2xl font-bold text-slate-800">بطاقة الناخب الإلكترونية</h2>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="bg-white border-2 border-slate-300 rounded-xl h-64 overflow-hidden shadow-sm flex items-center justify-center relative">
                    <span className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">الوجه</span>
                    {data.voterCardFront ? (
                      <img src={data.voterCardFront} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-300 font-bold text-lg">لا توجد صورة</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-white border-2 border-slate-300 rounded-xl h-64 overflow-hidden shadow-sm flex items-center justify-center relative">
                    <span className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">الظهر</span>
                    {data.voterCardBack ? (
                      <img src={data.voterCardBack} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-300 font-bold text-lg">لا توجد صورة</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="w-full border-t border-slate-300 pt-6 mt-8 flex justify-between items-center text-slate-400 text-sm">
             <span>تم التوليد بواسطة منصة الحملة الانتخابية الرقمية</span>
             <span>{new Date().toLocaleDateString('ar-EG')} {new Date().toLocaleTimeString('ar-EG')}</span>
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-100">
               <div className="flex items-center gap-3 text-slate-800">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">مراجعة وتأكيد البيانات</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-6 leading-relaxed text-lg">
                سيتم إنشاء مستند PDF رسمي يحتوي على:
                <ul className="list-disc list-inside mt-2 text-sm text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <li>الصفحة الأولى: التعهد القانوني بتوقيع الطرفين.</li>
                  <li>الصفحة الثانية: صور المستمسكات (البطاقة الوطنية + بطاقة الناخب).</li>
                </ul>
              </p>

              <div className="flex gap-3 justify-end mt-8">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isGenerating}
                  className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري التحضير...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      تأكيد وتصدير
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;