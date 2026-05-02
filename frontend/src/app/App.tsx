import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { Overview } from "./components/Overview";
import { DataIngestion } from "./components/DataIngestion";
import { DataSourceManagement } from "./components/DataSourceManagement";
import { IngestionTasks } from "./components/IngestionTasks";
import { ProductionOverview } from "./components/ProductionOverview";
import { ProductionScreen } from "./components/ProductionScreen";
import { ModelManagement } from "./components/ModelManagement";
import { DataDevelopment } from "./components/DataDevelopment";
import { OntologyApp } from "./components/OntologyApp";
import { SmartQA } from "./components/SmartQA";
import { SmartDocReview } from "./components/SmartDocReview";
import { SmartDataAnalysis } from "./components/SmartDataAnalysis";
import { LabOntologyApp } from "./components/lab/LabOntologyApp";
import { LabDataSource } from "./components/lab/LabDataSource";
import { LabSqlWorkbench } from "./components/lab/LabSqlWorkbench";
import { LabScripts } from "./components/lab/LabScripts";
import { LabWorkflow } from "./components/lab/LabWorkflow";
import { LabMonitor } from "./components/lab/LabMonitor";
import { LabVisualization } from "./components/lab/LabVisualization";
import { OntologyDefinition } from "./components/ontology/OntologyDefinition";
import { OntologyRelation } from "./components/ontology/OntologyRelation";
import { OntologyInject } from "./components/ontology/OntologyInject";
import { OntologyGraph } from "./components/ontology/OntologyGraph";
import { OntologySchema } from "./components/ontology/OntologySchema";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="data-ingestion" element={<DataIngestion />} />
          <Route path="data-source" element={<DataSourceManagement />} />
          <Route path="ingestion-tasks" element={<IngestionTasks />} />
          <Route path="production" element={<ProductionOverview />} />
          <Route path="production-screen" element={<ProductionScreen />} />
          <Route path="model-management" element={<ModelManagement />} />
          <Route path="data-development" element={<DataDevelopment />} />
          <Route path="lab/ontology-app" element={<LabOntologyApp />} />
          <Route path="lab/data-source" element={<LabDataSource />} />
          <Route path="lab/sql" element={<LabSqlWorkbench />} />
          <Route path="lab/scripts" element={<LabScripts />} />
          <Route path="lab/workflow" element={<LabWorkflow />} />
          <Route path="lab/monitor" element={<LabMonitor />} />
          <Route path="lab/visualization" element={<LabVisualization />} />
          <Route path="ontology-modeling" element={<Navigate to="/ontology-modeling/definition" replace />} />
          <Route path="ontology-modeling/definition" element={<OntologyDefinition />} />
          <Route path="ontology-modeling/relation" element={<OntologyRelation />} />
          <Route path="ontology-modeling/graph" element={<OntologyGraph />} />
          <Route path="ontology-modeling/schema" element={<OntologySchema />} />
          <Route path="ontology-modeling/inject" element={<OntologyInject />} />
          <Route path="ontology-app" element={<OntologyApp />} />
          <Route path="smart-qa" element={<SmartQA />} />
          <Route path="smart-doc-review" element={<SmartDocReview />} />
          <Route path="smart-data-analysis" element={<SmartDataAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
