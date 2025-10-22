import InfoCard from "@/components/InfoCard";

export default function Page() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <InfoCard 
                    title="Data & Privacy Details" 
                    description="Your trust is the most important thing to us. Your trust is also the guiding principle for all our design, implementation and execution efforts. We have created this page to create complete & full transparency around the following: 1- Subscriber Data that is stored by Webpushr on its servers, and 2- Data stored by Webpushr on your Users' devices (Browser based storage elements such as Cookies, Local Storage, etc.). We store and use this data for the sole purpose of offering push notification services to you. Please take a look at our privacy policy for more detail."
                />
            </div>

            {/* User Data Section */}
            <div className="bg-white rounded-lg border border-border dark:bg-[#222] p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 dark:text-white">User Data</h2>
                <p className="text-gray-600 mb-6 dark:text-gray-300">
                    We store following data points for each Subscriber. A Subscriber is someone who has opted to receive push notifications from your website. We do not store any data related to your site visitors that have not opted to receive push notifications.
                </p>
                
                <div className="space-y-4">
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">date</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This is the date when the subscribers opts to receive push notifications from your site.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">endpoint</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">The endpoint takes the form of a custom URL and associated encrypted keys pointing to a push server.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">timezone</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Subscriber&apos;s local timezone.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">device_type</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Mobile or Desktop.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">operating_system</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Mac OS, Windows, Android, etc.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">browser</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Chrome, Firefox, Opera, Edge, etc.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">ip_address</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">
                                Subscriber&apos;s IP Address. You can configure this{" "}
                                <a href="#" className="text-blue-600 hover:text-blue-800 underline">here</a>.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">city</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Geographic Location: City</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">state</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Geographic Location: State</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">country</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Geographic Location: Country</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-32 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">session_date</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">Date corresponding to the last session</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cookies Section */}
            <div className="bg-white rounded-lg border border-border p-6 dark:bg-[#222]">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 dark:text-white">Cookies</h2>
                <p className="text-gray-600 mb-6 dark:text-gray-300">
                    Webpushr JavaScript snippet use HTTP Cookies to &quot;remember&quot; what a user has done on previous pages / interactions with the website. These cookies are used to control the opt-in prompt behavior on the site, based on user specifications.
                </p>
                
                <div className="space-y-6">
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrPageviews</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">
                                We only store this cookie if the publisher (you) set the prompt (Custom Prompt) to show after x page visits. This cookie tracks the number of page visits on publisher&apos;s site. If the publisher (you) decide to select native opt-in prompt then this cookie is not set.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrSubscriberID</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This is set for non-https sites ONLY to check if the user is subscribed or not</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrPromptAction</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This cookie is stored if the user declines to receive push notifications and dismiss the custom prompt. This helps us remember that decision.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrEndPoint</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This cookie stores a unique URL associated with the user&apos;s push subscription. It is only stored if the user accepts to receive push notifications.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrLastVisit</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This cookie stores timestamp associated with the user&apos;s last visit on the site. It is only stored if the user accepts to receive push notifications. This helps us successfully manage and send push notifications.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrSessionLog</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This cookie is used to enable/show the entire opt-in funnel (unique user sessions, prompt impressions, user actions on custom and native prompt, etc.) at the site level in Webpushr Dashboard.</p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushrSubscriberCount</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">
                                This cookie is used to show subscriber count under the opt-in button when <span className="font-semibold">Show Subscriber Count:</span> option is set to <span className="font-semibold">True</span> in <span className="font-semibold">Opt-in Button</span> configuration page in Webpushr Dashboard.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-48 flex-shrink-0">
                            <span className="text-red-500 font-mono text-sm">_webpushr</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-white">This cookie stores user&apos;s preferences related to Notification Center and Notification Card and subscription related information like subscription endpoint, topics etc.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg border border-border p-6 dark:bg-[#222]">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 dark:text-white">Frequently asked questions</h2>
                
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">
                            Can Webpushr determine the end-user identity with the location and all other data that is stored?
                        </h3>
                        <p className="text-gray-700 dark:text-white">
                            All data stored by Webpushr on your behalf is listed on this page. Webpushr is not able to determine end-user identity with the current data it stores. The only exception is if Custom Attributes feature is used by you to enhance customer data with personally identifiable information such as full name, address, etc.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">
                            Will I lose any Webpushr functionality if I turn IP address storage off?
                        </h3>
                        <p className="text-gray-700 dark:text-white">
                            You can configure whether or not Webpushr stores subscriber IP address{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-800 underline">here</a>. You will not lose any functionality if you decide to turn this off.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">
                            What happens if a subscriber unsubscribes from receiving push notifications. What happens to such user&apos;s data? Does the website owner have to delete all the subscriber data manually/API?
                        </h3>
                        <p className="text-gray-700 dark:text-white">
                            You, as the website owner, do not have to perform any manual action to delete subscriber data when a user unsubscribes from receiving push notifications. Webpushr automatically deletes all subscriber data from it&apos;s servers when a user unsubscribes.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">
                            How long do you store subscriber data?
                        </h3>
                        <p className="text-gray-700 dark:text-white">
                            We store subscriber data indefinitely unless two conditions are met: 1- You, the site owner, deletes the site from our platform. 2- The subscriber unsubscribes from receiving push notifications.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">
                            How can I be GDPR compliant while using Webpushr?
                        </h3>
                        <p className="text-gray-700 mb-4 dark:text-white">
                            In order to comply with GDPR or other regulations, please plan to appropriately disclose all information, that is listed on this page that Webpushr will store on your behalf, to your site visitors. Most of our customers append subscriber consent with information listed on this page. You must also turn{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-800 underline">IP storage setting</a> to OFF to be GDPR compliant.
                        </p>
                        <p className="text-gray-700 dark:text-white">
                            We also offer a GDPR compliant{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-800 underline">custom prompt</a> that creates additional transparency on all stored data points.
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4 dark:text-gray-300">Have more questions?</p>
                    <a 
                        href="#" 
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
                    >
                        Ask us anything
                    </a>
                </div>
            </div>
        </div>
    );
}