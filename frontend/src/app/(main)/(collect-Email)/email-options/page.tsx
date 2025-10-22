'use client'

import { useState } from "react"
import InfoCard from "@/components/InfoCard"

export default function Page() {
    const [isEnabled, setIsEnabled] = useState(false)
    const [animation, setAnimation] = useState("Slide-in")
    const [backgroundColor, setBackgroundColor] = useState("#ffffff")
    const [text, setText] = useState("Opt-in for latest news and updates")
    const [cancelButton, setCancelButton] = useState("Not Yet")
    const [submitButton, setSubmitButton] = useState("Subscribe")
    const [rePromptDelay, setRePromptDelay] = useState("1")
    const [thankYouMessage, setThankYouMessage] = useState("Thank You...")
    
    // Email settings
    const [collectEmail, setCollectEmail] = useState(true)
    const [emailLabel, setEmailLabel] = useState("Email Address")
    const [emailValidationError, setEmailValidationError] = useState("Please enter a valid e-mail address")
    const [emailRequired, setEmailRequired] = useState(true)
    
    // Phone settings
    const [collectPhone, setCollectPhone] = useState(true)
    const [phoneLabel, setPhoneLabel] = useState("Phone Number")
    const [phoneValidationError, setPhoneValidationError] = useState("Please enter a valid phone number")
    const [defaultCountry, setDefaultCountry] = useState("United States")
    const [phoneRequired, setPhoneRequired] = useState(true)

    const handleSave = () => {
        console.log("Saving email prompt settings...")
    }

    const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
        <button
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? 'bg-blue-600' : 'bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    )

    const ColorPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#ffffff"
            />
        </div>
    )

    const PreviewPanel = () => (
        <div className="bg-gray-200 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview:</h3>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                <h4 className="text-lg font-medium text-gray-900 mb-4">{text}</h4>
                
                {collectEmail && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {emailLabel}
                        </label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder=""
                        />
                    </div>
                )}
                
                {collectPhone && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {phoneLabel}
                        </label>
                        <div className="flex">
                            <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                                <span className="text-sm">🇺🇸 +1</span>
                            </div>
                            <input
                                type="tel"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 text-blue-600 bg-transparent border border-blue-600 rounded-md hover:bg-blue-50">
                        {cancelButton}
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        {submitButton}
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <InfoCard 
                    title="Email Prompt" 
                    description="If enabled, the prompt to collect email & phone will be shown immediately after a user completes the action on the push notification prompt." 
                />
            </div>
            
            <div className="bg-white dark:bg-[#222] rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">Setup Email Prompt</h2>
                
                {/* Enable Toggle */}
                <div className="flex items-center gap-3 mb-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable:</label>
                    <Toggle checked={isEnabled} onChange={setIsEnabled} />
                </div>

                {!isEnabled && (
                    <div className="mb-6">
                        <div className="text-sm text-blue-600 mb-4">
                            <strong>Note:</strong> Any change here will go into effect immediately UNLESS you have previously dismissed the email prompt. If you do not see the change on your browser, please clear your browsing history and try again.
                        </div>
                    </div>
                )}

                {isEnabled && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Settings */}
                        <div className="space-y-6">
                            {/* Animation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Animation:
                                </label>
                                <select
                                    value={animation}
                                    onChange={(e) => setAnimation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Slide-in">Slide-in</option>
                                    <option value="Fade-in">Fade-in</option>
                                    <option value="Pop-up">Pop-up</option>
                                </select>
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Background Color:
                                </label>
                                <ColorPicker value={backgroundColor} onChange={setBackgroundColor} />
                            </div>

                            {/* Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Text:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="w-4 h-4 bg-black"></div>
                                </div>
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Icon:
                                </label>
                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                                    Upload
                                </button>
                            </div>

                            {/* Cancel Button */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Cancel Button:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={cancelButton}
                                        onChange={(e) => setCancelButton(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="w-4 h-4 bg-blue-600"></div>
                                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Submit Button:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={submitButton}
                                        onChange={(e) => setSubmitButton(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                                    <div className="w-4 h-4 bg-blue-600"></div>
                                </div>
                            </div>

                            {/* Re-prompt Delay */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Re-prompt Delay:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={rePromptDelay}
                                        onChange={(e) => setRePromptDelay(e.target.value)}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                    <span className="text-gray-600">day(s)</span>
                                </div>
                            </div>

                            {/* Thank You Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Thank You Message:
                                </label>
                                <textarea
                                    value={thankYouMessage}
                                    onChange={(e) => setThankYouMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            {/* Collect Email Section */}
                            <div className="border-t pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Collect Email:</label>
                                    <Toggle checked={collectEmail} onChange={setCollectEmail} />
                                </div>

                                {collectEmail && (
                                    <div className="space-y-4 ml-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Label:
                                            </label>
                                            <input
                                                type="text"
                                                value={emailLabel}
                                                onChange={(e) => setEmailLabel(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Validation Error:
                                            </label>
                                            <input
                                                type="text"
                                                value={emailValidationError}
                                                onChange={(e) => setEmailValidationError(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Required:</label>
                                            <Toggle checked={emailRequired} onChange={setEmailRequired} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Collect Phone Number Section */}
                            <div className="border-t pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Collect Phone Number:</label>
                                    <Toggle checked={collectPhone} onChange={setCollectPhone} />
                                </div>

                                {collectPhone && (
                                    <div className="space-y-4 ml-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Label:
                                            </label>
                                            <input
                                                type="text"
                                                value={phoneLabel}
                                                onChange={(e) => setPhoneLabel(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Validation Error:
                                            </label>
                                            <input
                                                type="text"
                                                value={phoneValidationError}
                                                onChange={(e) => setPhoneValidationError(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Default Country:
                                            </label>
                                            <select
                                                value={defaultCountry}
                                                onChange={(e) => setDefaultCountry(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="United States">United States</option>
                                                <option value="Canada">Canada</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Spain">Spain</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Required:</label>
                                            <Toggle checked={phoneRequired} onChange={setPhoneRequired} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Preview */}
                        <div>
                            <PreviewPanel />
                        </div>
                    </div>
                )}

                {/* Note and Save Button */}
                <div className="mt-8 border-t pt-6">
                    <div className="text-sm text-blue-600 mb-4">
                        <strong>Note:</strong> Any change here will go into effect immediately UNLESS you have previously dismissed the email prompt. If you do not see the change on your browser, please clear your browsing history and try again.
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}