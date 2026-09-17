import React, { useState } from 'react';
import { X, Smartphone, Download, ExternalLink, Copy, Check, Sparkles, Terminal, ShieldCheck, Layers } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkExportModalProps {
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pwabuilder' | 'direct' | 'cli'>('pwabuilder');

  const sharedAppUrl = 'https://ais-pre-i324aqec2sxbjg6i5ohg5x-399475886316.europe-west2.run.app';
  const currentBrowserUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const [selectedUrl, setSelectedUrl] = useState<string>(sharedAppUrl || currentBrowserUrl);

  const pwabuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(selectedUrl)}`;

  const bubblewrapCommand = `# Option A : Génération APK automatique via Bubblewrap (TWA Google)
npx @bubblewrap/cli init --manifest="${selectedUrl}/manifest.webmanifest"
npx @bubblewrap/cli build
# Le fichier app-release-signed.apk est généré directement !`;

  const capacitorCommand = `# Option B : Conversion en projet Android natif avec Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "AutoGestion" "com.autogestion.carnet" --web-dir="dist"
npm run build
npx cap add android
npx cap open android
# Dans Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-t-2xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1B1B] text-[#D4AF37] border border-[#2A2A2A] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif italic text-white">Convertir en APK Android</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  Android & PWA
                </span>
              </div>
              <p className="text-[11px] text-[#888]">3 solutions pour installer ou obtenir le fichier .APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1B1B1B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Quick status card */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#333] bg-[#1A1A1A] flex items-center justify-center">
              <img src="/pwa-192x192.png" alt="AutoGestion Icon" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[#F0F0F0] text-sm truncate">AutoGestion - Carnet de Bord</h4>
              <p className="text-[11px] text-[#888] truncate font-mono">Package : com.autogestion.carnet • v1.0.0</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] text-[#00FF41]">
                  <ShieldCheck className="w-3 h-3" /> Manifest PWA conforme
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37]">
                  <Sparkles className="w-3 h-3" /> Compatible TWA
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-center">
            <button
              onClick={() => setActiveTab('pwabuilder')}
              className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'pwabuilder'
                  ? 'bg-[#D4AF37] text-black font-semibold shadow'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              1. En 1 clic (PWABuilder)
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-[#D4AF37] text-black font-semibold shadow'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              2. Installation Directe
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'cli'
                  ? 'bg-[#D4AF37] text-black font-semibold shadow'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              3. Terminal / CLI
            </button>
          </div>

          {/* TAB 1: PWABUILDER */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs">
                  <Download className="w-4 h-4" />
                  <span>Générateur APK automatisé (Recommandé)</span>
                </div>
                <p className="text-[#AAA] leading-relaxed text-[11px]">
                  <strong>PWABuilder</strong> (outil open-source développé par Microsoft et soutenu par Google) analyse votre manifeste et compile automatiquement un package <strong>APK Android signé</strong> ou un <strong>bundle Google Play (.aab)</strong>.
                </p>

                <div className="pt-2 border-t border-[#2A2A2A] space-y-1.5">
                  <p className="text-[#888] text-[10px] uppercase font-bold tracking-wider">Comment faire :</p>
                  <ol className="list-decimal list-inside text-[11px] text-[#CCC] space-y-1">
                    <li>Cliquez sur le bouton ci-dessous pour ouvrir PWABuilder.</li>
                    <li>Cliquez sur <span className="text-[#D4AF37] font-semibold">"Package for Stores"</span> puis <span className="text-[#D4AF37] font-semibold">"Android"</span>.</li>
                    <li>Téléchargez votre fichier <strong>.apk</strong> ou <strong>.aab</strong> prêt à installer sur votre téléphone ou à publier !</li>
                  </ol>
                </div>
              </div>

              <a
                href={pwabuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer shadow-lg shadow-[#D4AF37]/10"
              >
                <ExternalLink className="w-4 h-4" />
                Générer mon fichier .APK sur PWABuilder
              </a>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#888]">URL publique de votre application :</span>
                  <button
                    onClick={() => handleCopy(selectedUrl, 'url')}
                    className="flex items-center gap-1 text-[#D4AF37] hover:underline shrink-0 font-medium cursor-pointer"
                  >
                    {copiedTab === 'url' ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTab === 'url' ? 'Copié !' : 'Copier l\'URL'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-between text-[11px]">
                  <span className="text-[#CCC] truncate font-mono text-[10px]">{selectedUrl}</span>
                </div>
                {currentBrowserUrl && currentBrowserUrl !== sharedAppUrl && (
                  <div className="flex items-center gap-2 pt-1 text-[10px]">
                    <span className="text-[#777]">Changer l'URL source :</span>
                    <button
                      onClick={() => setSelectedUrl(sharedAppUrl)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${selectedUrl === sharedAppUrl ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40' : 'text-[#888] hover:text-white'}`}
                    >
                      URL Partagée
                    </button>
                    <button
                      onClick={() => setSelectedUrl(currentBrowserUrl)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${selectedUrl === currentBrowserUrl ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40' : 'text-[#888] hover:text-white'}`}
                    >
                      URL Locale
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT INSTALL */}
          {activeTab === 'direct' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Installation PWA native sur l'écran d'accueil</span>
                </div>
                <p className="text-[#AAA] leading-relaxed text-[11px]">
                  Sur Android, vous n'avez même pas besoin d'un fichier APK lourd ! Le navigateur Chrome installe l'application avec sa propre icône, sans barre d'URL, avec support hors-ligne et performances équivalentes à une application native.
                </p>

                {isInstalled ? (
                  <div className="p-3 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4" />
                    <span>L'application est déjà installée sur cet appareil !</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00FF41] hover:bg-[#00DD38] text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Installer sur mon téléphone Android maintenant
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#BBB] space-y-1.5 text-[11px]">
                    <p className="font-semibold text-white">Pour installer depuis Google Chrome Android :</p>
                    <p>1. Appuyez sur le menu <span className="font-bold text-white">⋮</span> (3 petits points en haut à droite de Chrome).</p>
                    <p>2. Choisissez <span className="text-[#D4AF37] font-semibold">"Installer l'application"</span> ou <span className="text-[#D4AF37] font-semibold">"Ajouter à l'écran d'accueil"</span>.</p>
                    <p>3. L'icône AutoGestion apparaitra directement sur votre téléphone !</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CLI / DEVELOPER */}
          {activeTab === 'cli' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-[#888] text-[11px]">
                Pour les développeurs qui souhaitent compiler l'APK avec Gradle ou ouvrir le code source sous Android Studio :
              </p>

              {/* Bubblewrap */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#D4AF37] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Méthode Google Bubblewrap (TWA)
                  </span>
                  <button
                    onClick={() => handleCopy(bubblewrapCommand, 'bubblewrap')}
                    className="flex items-center gap-1 text-[10px] text-[#888] hover:text-[#D4AF37] cursor-pointer"
                  >
                    {copiedTab === 'bubblewrap' ? <Check className="w-3 h-3 text-[#00FF41]" /> : <Copy className="w-3 h-3" />}
                    {copiedTab === 'bubblewrap' ? 'Copié' : 'Copier'}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#AAA] font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed">
                  {bubblewrapCommand}
                </pre>
              </div>

              {/* Capacitor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#D4AF37] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Méthode Capacitor / Android Studio
                  </span>
                  <button
                    onClick={() => handleCopy(capacitorCommand, 'capacitor')}
                    className="flex items-center gap-1 text-[10px] text-[#888] hover:text-[#D4AF37] cursor-pointer"
                  >
                    {copiedTab === 'capacitor' ? <Check className="w-3 h-3 text-[#00FF41]" /> : <Copy className="w-3 h-3" />}
                    {copiedTab === 'capacitor' ? 'Copié' : 'Copier'}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#AAA] font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed">
                  {capacitorCommand}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
