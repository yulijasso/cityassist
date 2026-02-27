"use client";

import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiInbox } from "react-icons/fi";
import { Conversation, INTENT_LABELS } from "@/lib/types";
import { useRef, useState, useEffect } from "react";

const ROW_HEIGHT = 33; // approximate height of each row in px
const HEADER_HEIGHT = 70; // table header + top bar
const PAGINATION_HEIGHT = 40;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: "orange", label: "New" },
  open: { color: "green", label: "Open" },
  escalated: { color: "red", label: "Escalated" },
  resolved: { color: "gray", label: "Resolved" },
};

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

export default function TicketTable({
  conversations,
  selectedId,
  currentPage,
  onPageChange,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ticketsPerPage, setTicketsPerPage] = useState(20);

  useEffect(() => {
    const calculate = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientHeight - HEADER_HEIGHT - PAGINATION_HEIGHT;
        const count = Math.max(5, Math.floor(available / ROW_HEIGHT));
        setTicketsPerPage(count);
      }
    };
    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

  const totalPages = Math.max(1, Math.ceil(conversations.length / ticketsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * ticketsPerPage;
  const pageTickets = conversations.slice(startIdx, startIdx + ticketsPerPage);

  const getSubject = (conv: Conversation) => {
    const firstUserMsg = conv.messages.find((m) => m.role === "user");
    if (!firstUserMsg) return "No subject";
    const text = firstUserMsg.content;
    return text.length > 70 ? text.slice(0, 70) + "..." : text;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Box ref={containerRef} flex={1} display="flex" flexDirection="column" bg="white" overflow="hidden">
      {/* Header */}
      <Flex px={4} py={2} borderBottom="1px solid" borderColor="gray.200" align="center">
        <Text fontSize="xs" color="gray.500">
          {conversations.length} ticket{conversations.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
        </Text>
      </Flex>

      {/* Table */}
      <Box flex={1} overflowY="auto" bg="white">
        {pageTickets.length === 0 ? (
          <Flex direction="column" align="center" py={16} color="gray.400">
            <Icon as={FiInbox} boxSize={10} mb={3} />
            <Text fontSize="sm" fontWeight="500">No tickets</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Tickets will appear here when users start conversations
            </Text>
          </Flex>
        ) : (
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={4}
                  w="80px"
                >
                  Status
                </Th>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={3}
                >
                  Subject
                </Th>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={3}
                  w="130px"
                >
                  Requester
                </Th>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={3}
                  w="140px"
                >
                  Intent
                </Th>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={3}
                  w="120px"
                >
                  Department
                </Th>
                <Th
                  fontSize="11px"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  py={2}
                  px={3}
                  w="80px"
                  textAlign="right"
                >
                  Requested
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {pageTickets.map((conv) => {
                const cfg = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open;
                const isSelected = conv.id === selectedId;
                return (
                  <Tr
                    key={conv.id}
                    cursor="pointer"
                    bg={isSelected ? "blue.50" : "white"}
                    _hover={{ bg: isSelected ? "blue.50" : "gray.50" }}
                    onClick={() => onSelect(conv.id)}
                    transition="background 0.1s"
                    borderLeft="3px solid"
                    borderLeftColor={isSelected ? "blue.500" : "transparent"}
                  >
                    <Td py={1} px={4} borderBottom="1px solid" borderColor="gray.100">
                      <Badge
                        colorScheme={cfg.color}
                        fontSize="11px"
                        fontWeight="500"
                        textTransform="capitalize"
                        px={2}
                        py={0}
                        borderRadius="sm"
                      >
                        {cfg.label}
                      </Badge>
                    </Td>
                    <Td py={1} px={3} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="13px" fontWeight="400" color="gray.800" noOfLines={1}>
                        {getSubject(conv)}
                      </Text>
                    </Td>
                    <Td py={1} px={3} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="12px" color="gray.600" noOfLines={1}>
                        {conv.sessionId || "—"}
                      </Text>
                    </Td>
                    <Td py={1} px={3} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="12px" color="gray.500" noOfLines={1}>
                        {conv.intent ? INTENT_LABELS[conv.intent] || conv.intent : "—"}
                      </Text>
                    </Td>
                    <Td py={1} px={3} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="12px" color="gray.500" noOfLines={1}>
                        {conv.department || "—"}
                      </Text>
                    </Td>
                    <Td py={2} px={3} borderBottom="1px solid" borderColor="gray.100" textAlign="right">
                      <Text fontSize="12px" color="gray.400">
                        {formatTime(conv.updatedAt)}
                      </Text>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex
          px={4}
          py={2}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          align="center"
          justify="space-between"
        >
          <Text fontSize="xs" color="gray.500">
            {startIdx + 1}–{Math.min(startIdx + ticketsPerPage, conversations.length)} of{" "}
            {conversations.length}
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label="Previous page"
              icon={<Icon as={FiChevronLeft} />}
              size="xs"
              variant="ghost"
              isDisabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <Text key={`e${i}`} fontSize="xs" color="gray.400" px={1}>
                  ...
                </Text>
              ) : (
                <Button
                  key={p}
                  size="xs"
                  variant={p === page ? "solid" : "ghost"}
                  colorScheme={p === page ? "blue" : "gray"}
                  minW="28px"
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <IconButton
              aria-label="Next page"
              icon={<Icon as={FiChevronRight} />}
              size="xs"
              variant="ghost"
              isDisabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
