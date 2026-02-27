"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Input,
  Badge,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiPhone,
  FiMail,
  FiTag,
  FiEdit2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { useParams } from "next/navigation";
import { useDepartments } from "@/lib/department-store";
import { DepartmentConfig } from "@/lib/types";

export default function DepartmentsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { departments, addDepartment, removeDepartment, updateDepartment, setTenantSlug } =
    useDepartments();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", contactEmail: "", contactPhone: "" });

  useEffect(() => {
    setTenantSlug(slug);
  }, [slug, setTenantSlug]);

  const handleAdd = () => {
    if (!newDept.name.trim()) return;
    const dept: DepartmentConfig = {
      id: `dept-${Date.now()}`,
      name: newDept.name.trim(),
      contactEmail: newDept.contactEmail.trim(),
      contactPhone: newDept.contactPhone.trim(),
      keywords: [],
      escalationEnabled: false,
    };
    addDepartment(dept);
    setNewDept({ name: "", contactEmail: "", contactPhone: "" });
    setShowAddForm(false);
    setEditingId(dept.id);
  };

  const handleRemove = (id: string) => {
    removeDepartment(id);
    if (editingId === id) setEditingId(null);
  };

  const handleAddKeyword = (deptId: string) => {
    if (!newKeyword.trim()) return;
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      updateDepartment(deptId, { keywords: [...dept.keywords, newKeyword.trim().toLowerCase()] });
    }
    setNewKeyword("");
  };

  const handleRemoveKeyword = (deptId: string, keyword: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      updateDepartment(deptId, { keywords: dept.keywords.filter((k) => k !== keyword) });
    }
  };

  return (
    <Box p={8} maxW="100%">
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="md" color="gray.800">Departments</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Configure routing keywords and contact info — no code required
          </Text>
        </Box>
        <Button
          size="sm"
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          Add Department
        </Button>
      </HStack>

      {showAddForm && (
        <Box bg="white" border="1px solid" borderColor="blue.200" borderRadius="lg" p={5} mb={4}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={3}>New Department</Text>
          <VStack spacing={3} align="stretch">
            <Input
              size="sm"
              placeholder="Department name"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <HStack>
              <Input
                size="sm"
                placeholder="Contact email"
                value={newDept.contactEmail}
                onChange={(e) => setNewDept({ ...newDept, contactEmail: e.target.value })}
              />
              <Input
                size="sm"
                placeholder="Contact phone"
                value={newDept.contactPhone}
                onChange={(e) => setNewDept({ ...newDept, contactPhone: e.target.value })}
              />
            </HStack>
            <HStack justify="flex-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" colorScheme="blue" onClick={handleAdd}>Create</Button>
            </HStack>
          </VStack>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {departments.length === 0 && !showAddForm && (
          <Flex
            direction="column"
            align="center"
            py={16}
            color="gray.400"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
          >
            <Icon as={FiUsers} boxSize={10} mb={3} />
            <Text fontSize="sm" fontWeight="500" color="gray.500">No departments yet</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>Click &quot;Add Department&quot; to get started</Text>
          </Flex>
        )}
        {departments.map((dept) => {
          const isEditing = editingId === dept.id;
          return (
            <Box
              key={dept.id}
              bg="white"
              border="1px solid"
              borderColor={isEditing ? "blue.200" : "gray.200"}
              borderRadius="lg"
              overflow="hidden"
              transition="all 0.15s"
            >
              <Flex px={5} py={4} align="center" justify="space-between">
                <HStack spacing={3}>
                  <Flex w={8} h={8} bg="blue.50" borderRadius="md" align="center" justify="center">
                    <Icon as={FiUsers} color="blue.500" boxSize={4} />
                  </Flex>
                  <Box>
                    <Text fontWeight="600" fontSize="sm" color="gray.800">{dept.name}</Text>
                    <HStack spacing={3} fontSize="xs" color="gray.400">
                      <HStack spacing={1}>
                        <Icon as={FiMail} boxSize={3} />
                        <Text>{dept.contactEmail || "—"}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiPhone} boxSize={3} />
                        <Text>{dept.contactPhone || "—"}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </HStack>
                <HStack spacing={2}>
                  <Badge colorScheme={dept.escalationEnabled ? "green" : "gray"} fontSize="10px">
                    {dept.escalationEnabled ? "Escalation On" : "Escalation Off"}
                  </Badge>
                  <IconButton
                    aria-label="Edit"
                    icon={<Icon as={isEditing ? FiCheck : FiEdit2} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditingId(isEditing ? null : dept.id)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<Icon as={FiTrash2} />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "red.500" }}
                    onClick={() => handleRemove(dept.id)}
                  />
                </HStack>
              </Flex>

              <Box px={5} pb={4}>
                <HStack spacing={1} mb={2}>
                  <Icon as={FiTag} boxSize={3} color="gray.400" />
                  <Text fontSize="xs" fontWeight="500" color="gray.500">Routing Keywords</Text>
                </HStack>
                <Flex gap={2} flexWrap="wrap">
                  {dept.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="11px"
                      colorScheme="gray"
                      variant="subtle"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {kw}
                      {isEditing && (
                        <Icon
                          as={FiX}
                          boxSize={3}
                          cursor="pointer"
                          _hover={{ color: "red.500" }}
                          onClick={() => handleRemoveKeyword(dept.id, kw)}
                        />
                      )}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {isEditing && (
                <Box px={5} pb={4} pt={2} borderTop="1px solid" borderColor="gray.100">
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Input
                        size="sm"
                        placeholder="Add keyword..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword(dept.id)}
                      />
                      <Button size="sm" onClick={() => handleAddKeyword(dept.id)} leftIcon={<Icon as={FiPlus} />}>
                        Add
                      </Button>
                    </HStack>
                    <HStack>
                      <Input
                        size="sm"
                        placeholder="Email"
                        value={dept.contactEmail}
                        onChange={(e) => updateDepartment(dept.id, { contactEmail: e.target.value })}
                      />
                      <Input
                        size="sm"
                        placeholder="Phone"
                        value={dept.contactPhone}
                        onChange={(e) => updateDepartment(dept.id, { contactPhone: e.target.value })}
                      />
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme={dept.escalationEnabled ? "red" : "green"}
                      onClick={() => updateDepartment(dept.id, { escalationEnabled: !dept.escalationEnabled })}
                    >
                      {dept.escalationEnabled ? "Disable Escalation" : "Enable Escalation"}
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
