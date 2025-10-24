/*
 * ⚠️ SECCIÓN TEMPORALMENTE DESHABILITADA ⚠️
 * Esta sección de REST API Keys (Public API) está comentada temporalmente
 * Fecha: 2025-10-24
 * No borrar - se reactivará próximamente
 */

'use client'
import InfoCard from "@/components/InfoCard";
import React, { useState } from "react";

const InputEditable = ({ value, onChange, label }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        readOnly
      />
    </div>
  );
};

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
};

export default function RestApiKeysPage() {
    const [apiKey] = useState("e6df5e45ff284524719812755e3ff4d0");
    const [authToken] = useState("110802");
    const [selectedEndpoint, setSelectedEndpoint] = useState("Send Push to All Subscribers");

    const endpoints = [
        "Send Push to All Subscribers",
        "Send Push to Segments",
        "Send Push to Single User",
        "Get Subscriber List"
    ];

    const generateCurlCode = () => {
        return `curl -X POST \\
-H "webpushrKey: ${apiKey}" \\
-H "webpushrAuthToken: ${authToken}" \\
-H "Content-Type: application/json" \\
-d '{"title":"notification_title","message":"notification message","target_url":"https://www.webpushr.com","action_buttons":[{"title":"Accept","url":"https://www.webpushr.com"}]}' \\
https://api.webpushr.com/v1/notification/send/all`;
    };

    const generatePhpCode = () => {
        return `<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.webpushr.com/v1/notification/send/all',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
    "title": "notification_title",
    "message": "notification message", 
    "target_url": "https://www.webpushr.com",
    "action_buttons": [
      {
        "title": "Accept",
        "url": "https://www.webpushr.com"
      }
    ]
  }',
  CURLOPT_HTTPHEADER => array(
    'webpushrKey: ${apiKey}',
    'webpushrAuthToken: ${authToken}',
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <InfoCard
                    title="REST API Keys"
                    description=""
                />
            </div>

            {/* ⚠️ FUNCIONALIDAD TEMPORALMENTE DESHABILITADA */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                        Funcionalidad en Mantenimiento
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        La sección de REST API Keys (Public API) está temporalmente deshabilitada.
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Esta función se reactivará próximamente. Por favor, utiliza las otras opciones disponibles.
                    </p>
                </div>
            </div>

            {/* CÓDIGO ORIGINAL COMENTADO - NO BORRAR */}
            {false && (
            <div className="hidden">
            {/* Todo el contenido original está aquí pero no se renderiza */}

            {/* API Keys Section */}
            <div className="bg-white border border-border dark:bg-[#222] rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputEditable
                        label="Key"
                        value={apiKey}
                        onChange={() => {}} // Read only
                    />
                    <InputEditable
                        label="Authentication Token"
                        value={authToken}
                        onChange={() => {}} // Read only
                    />
                </div>
            </div>

            {/* WordPress Integration Section */}
            <div>
                
                
                <div className="mt-6 bg-white border border-border  dark:bg-[#222] rounded-lg p-6">
                    <div className="w-full md:w-1/2 ">
                        <InputEditable
                            label="REST API Key"
                            value={apiKey}
                            onChange={() => {}} // Read only
                        />
                    </div>
                </div>
            </div>

            {/* Examples Section */}
            <div className="bg-white border border-border dark:bg-[#222] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">Examples</h2>
                
                {/* API Endpoint Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        API Endpoint
                    </label>
                    <select
                        value={selectedEndpoint}
                        onChange={(e) => setSelectedEndpoint(e.target.value)}
                        className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {endpoints.map((endpoint) => (
                            <option key={endpoint} value={endpoint}>
                                {endpoint}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Code Examples */}
                <div className="space-y-6">
                    <div>
                        <div className="flex space-x-4 mb-4">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
                                cURL
                            </button>
                            <button className="px-4 py-2 bg-gray-200 text-gray-700  rounded-md text-sm font-medium hover:bg-gray-300">
                                PHP
                            </button>
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300">
                                Documentation
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">cURL</h3>
                                <CodeBlock code={generateCurlCode()} />
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">PHP</h3>
                                <CodeBlock code={generatePhpCode()} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Nota:</strong> Mantén tus API keys seguras y nunca las compartas públicamente. 
                            Estas keys te permiten enviar notificaciones push a todos tus suscriptores.
                        </p>
                    </div>
                </div>
            </div>
            </div>
            )}
            {/* FIN CÓDIGO ORIGINAL COMENTADO */}
        </div>
    );
}