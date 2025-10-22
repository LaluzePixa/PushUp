interface MetricData {
    title: string;
    description: string;
  }

  export default function InfoCard({ title, description }: MetricData) {
    return (
        <div className="pt-6 w-13/14">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" >{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">{description}</p>
        </div>
    )
}