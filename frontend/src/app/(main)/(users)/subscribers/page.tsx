import Tables from "@/components/Table";
import InfoCard from "@/components/InfoCard";

export default function Page() {
    return (
        <div>
            <InfoCard title="Suscribers" description="Suscribers are the users who have subscribed to your newsletter." />
            <div className="dark:bg-[#222] border border-border rounded-lg p-6">
                <Tables />
            </div>
        </div>
    );
}