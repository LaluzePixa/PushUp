import InfoCard from "@/components/InfoCard";
export default function Page() {
    return (
        <div>
            <div>
                <InfoCard title="Custom Attributes" description="Custom Attributes are not supported by non-HTTPS sites. This is because web push is not supported on insecure non-HTTPS sites at all. As a workaround, we simulate web push on HTTP sites by opening a popup to a subdomain of our own secure site (e.g. https://subdomain.wpush.io)."/>
            </div>
        </div>
    );
}