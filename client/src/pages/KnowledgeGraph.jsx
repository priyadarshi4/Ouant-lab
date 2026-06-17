import { useKnowledgeGraph } from "../features/analytics/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import KnowledgeGraph from "../components/graph/KnowledgeGraph.jsx";

export default function KnowledgeGraphPage() {
  const { data, isLoading } = useKnowledgeGraph();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Knowledge Graph</h1>
        <p className="text-ink-secondary text-sm mt-1">
          A live map of how every strategy, indicator, symbol, market regime, and research note in the lab connects.
        </p>
      </div>

      <GlassCard>
        {isLoading ? <Spinner label="Mapping the research network..." /> : (
          <KnowledgeGraph nodes={data?.nodes || []} links={data?.links || []} />
        )}
      </GlassCard>
    </div>
  );
}
