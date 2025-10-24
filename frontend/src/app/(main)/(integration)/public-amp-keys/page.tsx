/*
 * ⚠️ SECCIÓN TEMPORALMENTE DESHABILITADA ⚠️
 * Esta sección de Public AMP Keys está comentada temporalmente
 * Fecha: 2025-10-24
 * No borrar - se reactivará próximamente
 */

'use client'
import InfoCard from "@/components/InfoCard";
import React, { useState } from "react";

const InputEditable = () => {
  const [valor, setValor] = useState("Texto inicial aquí");

  return (
    <input
      type="text"
      value={valor}
      onChange={e => setValor(e.target.value)}
      style={{ width: "100%" }}
      className="w-1/2 border-black border rounded-lg pl-2 p-1"
    />
  );
};

export default function PAmpKeysPage() {
    return (
        <div className="space-y-8">
            <div>
                <InfoCard title="AMP key for" description="" />
            </div>

            {/* ⚠️ FUNCIONALIDAD TEMPORALMENTE DESHABILITADA */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                        Funcionalidad en Mantenimiento
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        La sección de Public AMP Keys (Accelerated Mobile Pages) está temporalmente deshabilitada.
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Esta función se reactivará próximamente. Por favor, utiliza la integración manual.
                    </p>
                </div>
            </div>

            {/* CÓDIGO ORIGINAL COMENTADO - NO BORRAR
            <div className="bg-white border border-border rounded-lg p-6 dark:bg-[#222]">
                <p>WordPress Key</p>
                <p>Use the following REST API key to activate the Webpushr Plugin. Please make sure you are using the latest version of our WordPress Plugin.</p>
                <div className="block w-1/2 pt-2">
                    <p>REST API Key</p>
                    <InputEditable />
                </div>
            </div>
            */}
        </div>
    );
}