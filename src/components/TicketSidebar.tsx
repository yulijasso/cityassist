"use client";

import { Box, VStack, HStack, Text, Icon, Badge, Divider } from "@chakra-ui/react";
import {
  FiInbox,
  FiAlertCircle,
  FiMessageSquare,
  FiAlertTriangle,
  FiCheckCircle,
  FiUsers,
} from "react-icons/fi";
import { FiMinusCircle } from "react-icons/fi";
import { Conversation } from "@/lib/types";
import { useDepartments } from "@/lib/department-store";

export type ViewFilter = string; // "all" | status | "dept:DeptName"

interface Props {
  conversations: Conversation[];
  activeView: ViewFilter;
  onViewChange: (view: ViewFilter) => void;
}

const STATUS_VIEWS: { key: string; label: string; icon: typeof FiInbox; color: string }[] = [
  { key: "all", label: "All Tickets", icon: FiInbox, color: "gray.600" },
  { key: "new", label: "New", icon: FiAlertCircle, color: "blue.500" },
  { key: "open", label: "Open", icon: FiMessageSquare, color: "green.500" },
  { key: "escalated", label: "Escalated", icon: FiAlertTriangle, color: "red.500" },
  { key: "resolved", label: "Resolved", icon: FiCheckCircle, color: "gray.400" },
];

export default function TicketSidebar({ conversations, activeView, onViewChange }: Props) {
  const { departments } = useDepartments();

  const getStatusCount = (view: string) => {
    if (view === "all") return conversations.length;
    return conversations.filter((c) => c.status === view).length;
  };

  const getDeptCount = (deptName: string) => {
    return conversations.filter((c) => c.department === deptName).length;
  };

  return (
    <Box
      w="200px"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      flexShrink={0}
      py={4}
      overflowY="auto"
    >
      <Text fontSize="11px" fontWeight="600" color="gray.400" px={4} mb={2} textTransform="uppercase" letterSpacing="wider">
        Status
      </Text>
      <VStack spacing={0} align="stretch">
        {STATUS_VIEWS.map((view) => {
          const isActive = activeView === view.key;
          const count = getStatusCount(view.key);
          return (
            <HStack
              key={view.key}
              px={4}
              py={1.5}
              cursor="pointer"
              bg={isActive ? "blue.50" : "transparent"}
              color={isActive ? "blue.700" : "gray.600"}
              _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
              onClick={() => onViewChange(view.key)}
              justify="space-between"
              transition="all 0.1s"
            >
              <HStack spacing={2}>
                <Icon as={view.icon} boxSize={3.5} color={isActive ? "blue.500" : view.color} />
                <Text fontSize="13px" fontWeight={isActive ? "600" : "400"}>
                  {view.label}
                </Text>
              </HStack>
              {count > 0 && (
                <Badge
                  fontSize="10px"
                  borderRadius="full"
                  px={1.5}
                  minW="20px"
                  textAlign="center"
                  colorScheme={isActive ? "blue" : "gray"}
                  variant="subtle"
                >
                  {count}
                </Badge>
              )}
            </HStack>
          );
        })}
      </VStack>

      {(
        <>
          <Divider my={3} />
          <Text fontSize="11px" fontWeight="600" color="gray.400" px={4} mb={2} textTransform="uppercase" letterSpacing="wider">
            Departments
          </Text>
          <VStack spacing={0} align="stretch">
            {/* Unassigned */}
            {(() => {
              const isActive = activeView === "dept:unassigned";
              const count = conversations.filter((c) => !c.department).length;
              return (
                <HStack
                  px={4}
                  py={1.5}
                  cursor="pointer"
                  bg={isActive ? "blue.50" : "transparent"}
                  color={isActive ? "blue.700" : "gray.600"}
                  _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
                  onClick={() => onViewChange("dept:unassigned")}
                  justify="space-between"
                  transition="all 0.1s"
                >
                  <HStack spacing={2}>
                    <Icon as={FiMinusCircle} boxSize={3.5} color={isActive ? "blue.500" : "gray.400"} />
                    <Text fontSize="13px" fontWeight={isActive ? "600" : "400"}>
                      Unassigned
                    </Text>
                  </HStack>
                  {count > 0 && (
                    <Badge
                      fontSize="10px"
                      borderRadius="full"
                      px={1.5}
                      minW="20px"
                      textAlign="center"
                      colorScheme={isActive ? "blue" : "gray"}
                      variant="subtle"
                    >
                      {count}
                    </Badge>
                  )}
                </HStack>
              );
            })()}
            {departments.map((dept) => {
              const key = `dept:${dept.name}`;
              const isActive = activeView === key;
              const count = getDeptCount(dept.name);
              return (
                <HStack
                  key={dept.id}
                  px={4}
                  py={1.5}
                  cursor="pointer"
                  bg={isActive ? "blue.50" : "transparent"}
                  color={isActive ? "blue.700" : "gray.600"}
                  _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
                  onClick={() => onViewChange(key)}
                  justify="space-between"
                  transition="all 0.1s"
                >
                  <HStack spacing={2}>
                    <Icon as={FiUsers} boxSize={3.5} color={isActive ? "blue.500" : "gray.400"} />
                    <Text fontSize="13px" fontWeight={isActive ? "600" : "400"} noOfLines={1}>
                      {dept.name}
                    </Text>
                  </HStack>
                  {count > 0 && (
                    <Badge
                      fontSize="10px"
                      borderRadius="full"
                      px={1.5}
                      minW="20px"
                      textAlign="center"
                      colorScheme={isActive ? "blue" : "gray"}
                      variant="subtle"
                    >
                      {count}
                    </Badge>
                  )}
                </HStack>
              );
            })}
          </VStack>
        </>
      )}
    </Box>

  );
}
