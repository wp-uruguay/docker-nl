import AgentChat from "@/components/agent/AgentChat";
import ServiceNotice from "@/components/ServiceNotice";

export default function ManuV1Page() {
  return (
    <>
      <ServiceNotice />
      <AgentChat agent="manu" conversationId="manu-default" />
    </>
  );
}
