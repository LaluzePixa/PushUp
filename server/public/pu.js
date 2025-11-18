// PushUp - Ultra-compact loader script
(function (w, d, s) {
    // Get parameters from script URL
    var script = d.currentScript || d.querySelector('script[src*="pu.js"]');
    if (!script) return;

    var params = new URLSearchParams(script.src.split('?')[1] || '');
    var siteId = params.get('id');
    var key = params.get('k');

    if (!siteId) {
        console.error('PushUp: Missing siteId parameter');
        return;
    }

    // Load main PushSaaS library
    var base = script.src.split('/pu.js')[0];
    var mainScript = d.createElement(s);
    mainScript.src = base + '/pushsaas.js';
    mainScript.async = true;

    mainScript.onload = function () {
        // Initialize PushSaaS when loaded
        if (w.PushSaaS) {
            w.PushSaaS.init({
                siteId: parseInt(siteId),
                type: 'lightbox1',
                whenToShow: 'Show Immediately',
                text: 'Would you like to receive notifications on latest updates?',
                cancelButton: 'NOT YET',
                approveButton: 'YES',
                approveBgColor: '#2563eb',
                approveTextColor: '#ffffff'
            });
        }
    };

    d.head.appendChild(mainScript);
})(window, document, 'script');
