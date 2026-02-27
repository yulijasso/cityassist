"use client";

import { useState, useEffect, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useConversations } from "@/lib/conversation-store";
import { useDepartments } from "@/lib/department-store";
import { useSettings } from "@/lib/settings-store";
import TicketSidebar, { ViewFilter } from "@/components/TicketSidebar";
import TicketTable from "@/components/TicketTable";
import TicketDetailPanel from "@/components/TicketDetailPanel";

export default function ConversationsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { conversations, getConversation, updateConversation, setTenantSlug } =
    useConversations();
  const { setTenantSlug: setDeptTenantSlug } = useDepartments();
  const { setTenantSlug: setSettingsSlug } = useSettings();

  const [activeView, setActiveView] = useState<ViewFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setTenantSlug(slug);
    setDeptTenantSlug(slug);
    setSettingsSlug(slug);
  }, [slug, setTenantSlug, setDeptTenantSlug, setSettingsSlug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView]);

  const filtered = useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (activeView === "all") return sorted;
    // Check if it's a status filter
    if (["new", "open", "escalated", "resolved"].includes(activeView)) {
      return sorted.filter((c) => c.status === activeView);
    }
    // Department filters (prefixed with "dept:")
    if (activeView === "dept:unassigned") {
      return sorted.filter((c) => !c.department);
    }
    if (activeView.startsWith("dept:")) {
      const deptName = activeView.slice(5);
      return sorted.filter((c) => c.department === deptName);
    }
    return sorted;
  }, [conversations, activeView]);

  const selectedConversation = selectedId ? getConversation(selectedId) || null : null;

  const handleStatusChange = (id: string, status: string) => {
    updateConversation(id, {
      status: status as "new" | "open" | "resolved" | "escalated",
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDepartmentChange = (id: string, department: string) => {
    updateConversation(id, {
      department: department || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <Flex h="100vh" overflow="hidden">
        <TicketSidebar
          conversations={conversations}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        {selectedConversation ? (
          <TicketDetailPanel
            conversation={selectedConversation}
            onBack={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
            onDepartmentChange={handleDepartmentChange}
          />
        ) : (
          <TicketTable
            conversations={filtered}
            selectedId={selectedId}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelect={setSelectedId}
          />
        )}
      </Flex>
    </>
  );
}
