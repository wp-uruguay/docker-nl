import IframeView from "@/components/IframeView";
import { agentIframes } from "@/lib/agent-iframe";

export default function GrantPage() {
  return <IframeView title="Jordan" src={agentIframes.grant} />;
}
