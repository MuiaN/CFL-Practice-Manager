import CaseCard from "../CaseCard";

export default function CaseCardExample() {
  return (
    <div className="p-8 bg-background max-w-sm">
      <CaseCard
        caseNumber="CFL-2024-0042"
        title="Merger and Acquisition Agreement for Tech Startup"
        practiceArea="Corporate & Commercial"
        status="Active"
        assignedTo={[
          { name: "Sarah Kimani", initials: "SK" },
          { name: "Peter Ochieng", initials: "PO" },
          { name: "Mary Wanjiru", initials: "MW" },
        ]}
        lastUpdated="2 hours ago"
        onClick={() => console.log("Case card clicked")}
      />
    </div>
  );
}
