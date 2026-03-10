import IframeView from "@/components/IframeView";
import { agentIframes } from "@/lib/agent-iframe";

export default function MentoriaPage() {
  return <IframeView title="MentorIA" src={agentIframes.mentoria} />;
}
