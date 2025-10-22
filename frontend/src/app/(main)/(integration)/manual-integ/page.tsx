'use client'
import InfoCard from "@/components/InfoCard";
import React, { useState } from "react";

const CodigoTextarea = () => {
    const [codigo, setCodigo] = useState(`<!-- start webpushr tracking code --> 
    <script>(function(w,d, s, id) {if(typeof(w.webpushr)!=='undefined') return;w.webpushr=w.webpushr||function(){(w.webpushr.q=w.webpushr.q||[]).push(arguments)};var js, fjs = d.getElementsByTagName(s)[0];js = d.createElement(s); js.id = id;js.async=1;js.src = "https://cdn.webpushr.com/app.min.js";
    fjs.parentNode.appendChild(js);}(window,document, 'script', 'webpushr-jssdk'));
    webpushr('setup',{'key':'BEz3nl74LM0kmjjWtT3cJBiIDG-ts_lf9MXC3HuV8mcwHuGObm0ZI1hMiXgg8raXxc6xblcltcrcoDHZvbRxPo8', 'integration':'popup'  });</script>
    <!-- end webpushr tracking code -->`);
    const [copiado, setCopiado] = useState(false);

    const copiarAlPortapapeles = () => {
        navigator.clipboard.writeText(codigo);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000); // El mensaje desaparece después de 2 segundos
    };

    return (
        <div>
            <textarea
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                rows={10}
                style={{ width: "100%" }}
                className="border-black border "
            />
            <button onClick={copiarAlPortapapeles}>Copy to clipboard</button>
            {copiado && <span style={{ marginLeft: "10px", color: "green" }}>¡Copiado!</span>}
        </div>
    );
};

export default function ManualIntegrationPage() {
    return (
        <div className="space-y-8">
            <div>
                <InfoCard title="Tracking code for" description="Please follow the instructions below to manually integrate Webpushr to your site." />
            </div>
            <div className="bg-white border border-border dark:bg-[#222] rounded-lg p-6">
                <h2>Add Tracking Code</h2>
                <p>Copy and paste the javascript snippet below in the header of your site. See our documentation to learn how.</p>
                <div className=" pt-5 w-2/3">
                    <CodigoTextarea />
                </div>
            </div>
        </div>
    );
}