'use client'
import InfoCard from "@/components/InfoCard";
import React, { useState, useMemo } from "react";
import { useSiteContext } from "@/contexts/SiteContext";
import { Copy, Check } from "lucide-react";

const CodigoTextarea = ({ siteId, siteName }: { siteId?: number; siteName?: string }) => {
    // Generar código dinámico basado en el sitio seleccionado
    const codigo = useMemo(() => {
        if (!siteId) {
            return `<!-- Por favor selecciona un sitio para generar el código de tracking -->`;
        }

        // Generar una clave única basada en el ID del sitio (en un sistema real esto vendría del backend)
        const siteKey = `site_${siteId}_${siteName?.toLowerCase().replace(/\s+/g, '_')}`;

        return `<!-- start pushup tracking code -->
<script>
(function(w,d, s, id) {
    if(typeof(w.pushup)!=='undefined') return;
    w.pushup=w.pushup||function(){(w.pushup.q=w.pushup.q||[]).push(arguments)};
    var js, fjs = d.getElementsByTagName(s)[0];
    js = d.createElement(s);
    js.id = id;
    js.async=1;
    js.src = "https://cdn.pushup.com/app.min.js";
    fjs.parentNode.appendChild(js);
}(window,document, 'script', 'pushup-jssdk'));

pushup('setup',{
    'siteId': ${siteId},
    'key': '${siteKey}',
    'integration': 'manual'
});
</script>
<!-- end pushup tracking code -->`;
    }, [siteId, siteName]);

    const [copiado, setCopiado] = useState(false);

    const copiarAlPortapapeles = () => {
        navigator.clipboard.writeText(codigo);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700">
                    <code>{codigo}</code>
                </pre>
                <button
                    onClick={copiarAlPortapapeles}
                    disabled={!siteId}
                    className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                    {copiado ? (
                        <>
                            <Check className="h-3 w-3" />
                            <span>¡Copiado!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar código</span>
                        </>
                    )}
                </button>
            </div>

            {!siteId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                        ⚠️ Selecciona un sitio en el selector de arriba para generar el código de tracking.
                    </p>
                </div>
            )}
        </div>
    );
};

export default function ManualIntegrationPage() {
    const { selectedSite } = useSiteContext();

    return (
        <div className="space-y-8">
            <div>
                <InfoCard
                    title={selectedSite ? `Tracking code for ${selectedSite.name}` : "Manual Integration"}
                    description="Please follow the instructions below to manually integrate PushUp to your site."
                />
            </div>

            <div className="bg-white border border-border dark:bg-[#222] rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Add Tracking Code
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Copy and paste the JavaScript snippet below in the <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm">&lt;head&gt;</code> section of your site.
                    This code enables push notifications on your website.
                </p>

                <div className="space-y-4">
                    <CodigoTextarea
                        siteId={selectedSite?.id}
                        siteName={selectedSite?.name}
                    />

                    {selectedSite && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                📋 Installation Steps:
                            </h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                <li>Copy the tracking code above</li>
                                <li>Paste it in the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">&lt;head&gt;</code> section of your website</li>
                                <li>Make sure it loads on all pages you want to enable push notifications</li>
                                <li>Test by visiting your site and checking the browser console</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-border dark:bg-[#222] rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Verification
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    After installing the code, you can verify it's working by:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Opening your website in a browser</li>
                    <li>Opening the browser's Developer Console (F12)</li>
                    <li>Looking for "PushUp initialized" message in the console</li>
                    <li>The opt-in prompt should appear (if configured)</li>
                </ul>
            </div>
        </div>
    );
}