import IframeView from "@/components/IframeView";
import { agentIframes } from "@/lib/agent-iframe";

export default function ManuPage() {
  return <IframeView title="Manu" src={agentIframes.manu} />;
}
