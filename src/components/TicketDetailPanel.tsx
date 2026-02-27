"use client";

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  IconButton,
  Select,
  Divider,
} from "@chakra-ui/react";
import { FiArrowLeft, FiClock, FiUser, FiHash } from "react-icons/fi";
import { Conversation, INTENT_LABELS } from "@/lib/types";
import { useDepartments } from "@/lib/department-store";
import ConversationThread from "./ConversationThread";

const STATUS_OPTIONS: { value: Conversation["status"]; label: string; color: string }[] = [
  { value: "new", label: "New", color: "orange" },
  { value: "open", label: "Open", color: "green" },
  { value: "escalated", label: "Escalated", color: "red" },
  { value: "resolved", label: "Resolved", color: "gray" },
];

interface Props {
  conversation: Conversation;
  onBack: () => void;
  onStatusChange: (id: string, status: Conversation["status"]) => void;
  onDepartmentChange: (id: string, department: string) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="11px" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider">
      {children}
    </Text>
  );
}

export default function TicketDetailPanel({
  conversation,
  onBack,
  onStatusChange,
  onDepartmentChange,
}: Props) {
  const { departments } = useDepartments();
  const statusCfg = STATUS_OPTIONS.find((s) => s.value === conversation.status);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Build department options: merge store departments with current value
  const deptNamesSet = new Set(departments.map((d) => d.name));
  if (conversation.department) deptNamesSet.add(conversation.department);
  const deptNames = Array.from(deptNamesSet).sort();

  return (
    <Flex flex={1} overflow="hidden">
      {/* Left Properties Sidebar */}
      <Box
        w="220px"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.200"
        flexShrink={0}
        overflowY="auto"
        py={4}
      >
        {/* Back + Ticket ID */}
        <HStack px={4} mb={4} spacing={2}>
          <IconButton
            aria-label="Back to list"
            icon={<Icon as={FiArrowLeft} />}
            size="xs"
            variant="ghost"
            onClick={onBack}
          />
          <Text fontWeight="600" fontSize="xs" color="gray.500">
            Ticket #{conversation.id.split("-").pop()}
          </Text>
        </HStack>

        <VStack spacing={4} align="stretch" px={4}>
          {/* Status */}
          <Box>
            <FieldLabel>Status</FieldLabel>
            <Select
              size="xs"
              mt={1}
              value={conversation.status}
              onChange={(e) =>
                onStatusChange(conversation.id, e.target.value as Conversation["status"])
              }
              bg="gray.50"
              borderColor="gray.200"
              fontSize="12px"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Box>

          {/* Department */}
          <Box>
            <FieldLabel>Department</FieldLabel>
            <Select
              size="xs"
              mt={1}
              value={conversation.department || ""}
              onChange={(e) => onDepartmentChange(conversation.id, e.target.value)}
              bg="gray.50"
              borderColor="gray.200"
              fontSize="12px"
              placeholder="Unassigned"
            >
              {deptNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Box>

          {/* Intent */}
          <Box>
            <FieldLabel>Intent</FieldLabel>
            <Text fontSize="12px" color="gray.700" mt={1}>
              {conversation.intent
                ? INTENT_LABELS[conversation.intent] || conversation.intent
                : "—"}
            </Text>
          </Box>

          <Divider />

          {/* Requester */}
          <Box>
            <FieldLabel>Requester</FieldLabel>
            <HStack mt={1} spacing={1.5}>
              <Icon as={FiUser} boxSize={3} color="gray.400" />
              <Text fontSize="12px" color="gray.700">
                {conversation.sessionId || "Anonymous"}
              </Text>
            </HStack>
          </Box>

          {/* Conversation ID */}
          <Box>
            <FieldLabel>Conversation ID</FieldLabel>
            <HStack mt={1} spacing={1.5}>
              <Icon as={FiHash} boxSize={3} color="gray.400" />
              <Text fontSize="11px" color="gray.500" wordBreak="break-all">
                {conversation.id}
              </Text>
            </HStack>
          </Box>

          <Divider />

          {/* Created */}
          <Box>
            <FieldLabel>Created</FieldLabel>
            <HStack mt={1} spacing={1.5}>
              <Icon as={FiClock} boxSize={3} color="gray.400" />
              <Text fontSize="12px" color="gray.600">
                {formatDate(conversation.startedAt)}
              </Text>
            </HStack>
          </Box>

          {/* Updated */}
          <Box>
            <FieldLabel>Updated</FieldLabel>
            <HStack mt={1} spacing={1.5}>
              <Icon as={FiClock} boxSize={3} color="gray.400" />
              <Text fontSize="12px" color="gray.600">
                {formatDate(conversation.updatedAt)}
              </Text>
            </HStack>
          </Box>

          {/* Messages count */}
          <Box>
            <FieldLabel>Messages</FieldLabel>
            <Text fontSize="12px" color="gray.700" mt={1}>
              {conversation.messages.length}
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* Right: Conversation Thread */}
      <Box flex={1} display="flex" flexDirection="column" bg="white" overflow="hidden">
        {/* Thread Header */}
        <Flex px={4} py={3} borderBottom="1px solid" borderColor="gray.200" align="center" gap={3}>
          <Text fontWeight="600" fontSize="sm" color="gray.800">
            Conversation
          </Text>
          <Badge
            colorScheme={statusCfg?.color || "gray"}
            fontSize="11px"
            textTransform="capitalize"
          >
            {conversation.status}
          </Badge>
          {conversation.department && (
            <Badge fontSize="11px" colorScheme="blue" variant="subtle">
              {conversation.department}
            </Badge>
          )}
        </Flex>

        {/* Thread */}
        <Box flex={1} overflow="auto">
          <ConversationThread conversation={conversation} hideHeader />
        </Box>
      </Box>
    </Flex>
  );
}
