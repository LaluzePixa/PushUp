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

export default function WPPluginPage() {
    return (
        <div className="space-y-8">
            <div>
                <InfoCard title="Wordpress Plugin integration" description="" />
            </div>
            <div className="bg-white border border-border rounded-lg p-6 dark:bg-[#222]">
                <p>WordPress Key</p>
                <p>Use the following REST API key to activate the Webpushr Plugin. Please make sure you are using the latest version of our WordPress Plugin.</p>
                <div className="block w-1/2 pt-2">
                    <p>REST API Key</p>
                    <InputEditable />
                </div>
            </div>
        </div>
    );
}