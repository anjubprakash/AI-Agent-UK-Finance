import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Center,
  Avatar,
  SimpleGrid,
  Tooltip,
  IconButton,
  RadioGroup,
  Radio,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  InputGroup,
  InputRightElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  UserPlus,
  Users,
  ShieldCheck,
  UserCheck,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Upload,
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('ADMIN');
  const [department, setDepartment] = useState('Compliance Administration');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Role Change Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    targetRole: null,
  });

  // Delete User Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
  });

  // Query users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  const usersList = usersData?.data?.users || [];
  const adminCount = usersData?.data?.adminCount || 0;
  const employeeCount = usersData?.data?.employeeCount || 0;
  const totalUsers = usersData?.data?.totalUsers || 0;

  // Mutation to create a new user (Admin or Employee)
  const createMutation = useMutation({
    mutationFn: (data) => authApi.createUser(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setName('');
      setEmail('');
      setPassword('');
      toast({
        title: `${res.data.role === 'ADMIN' ? 'Administrator' : 'Employee'} Created`,
        description: `${res.data.name} has been added with ${res.data.role === 'ADMIN' ? 'document upload and rule management authority' : 'standard copilot query access'}.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    },
    onError: (err) => {
      toast({
        title: 'Creation Failed',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });

  // Mutation to promote/demote a user's role
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, targetRole }) => authApi.updateUserRole(id, targetRole),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmModal({ isOpen: false, user: null, targetRole: null });
      toast({
        title: 'Role Updated',
        description: res.message || 'User role has been successfully updated.',
        status: 'success',
        duration: 3500,
        isClosable: true,
      });
    },
    onError: (err) => {
      toast({
        title: 'Role Update Failed',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });

  // Mutation to delete a user
  const deleteMutation = useMutation({
    mutationFn: (id) => authApi.deleteUser(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteModal({ isOpen: false, user: null });
      toast({
        title: 'User Removed',
        description: res.message || 'User account was removed.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (err) => {
      toast({
        title: 'Deletion Failed',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: 'Please fill in all required fields', status: 'warning', duration: 2500 });
      return;
    }
    createMutation.mutate({ name, email, password, role, department });
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const cardBg = useColorModeValue('white', '#141E1C');
  const cardBorder = useColorModeValue('#E5ECE8', '#263B36');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const subTextColor = useColorModeValue('gray.600', '#94A3B8');
  const mutedTextColor = useColorModeValue('gray.500', '#64748B');
  const iconBoxBg = useColorModeValue('#F4F7F5', '#1A2926');
  const adminBoxBg = useColorModeValue('#E8F2EF', '#1E322D');
  const formBoxBg = useColorModeValue('#F4F7F5', '#162320');
  const formBoxBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const theadBg = useColorModeValue('#F4F7F5', '#1A2926');
  const trHoverBg = useColorModeValue('#F8FAF9', '#1C2B27');
  const searchBg = useColorModeValue('#F4F7F5', '#182724');
  const searchBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const inputBg = useColorModeValue('white', '#182724');
  const inputBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const badgeEmpBg = useColorModeValue('#F4F7F5', '#1A2332');
  const badgeEmpBorder = useColorModeValue('#CAD7D0', '#263B4D');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header Title */}
        <Box>
          <HStack spacing={3} align="center">
            <Box p={2.5} bg="#52796F" color="white" borderRadius="xl">
              <ShieldCheck size={26} />
            </Box>
            <Box>
              <Heading size="lg" color={headingColor} fontWeight="800">
                Team & Administrator Access Management
              </Heading>
              <Text fontSize="sm" color={subTextColor} mt={1}>
                Provision administrator privileges (upload statutory rulebooks, update versions, execute FCA live syncs) and manage compliance members.
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Top KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
            <CardBody p={5}>
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="2xs" color="#84A98C" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">
                    TOTAL SYSTEM USERS
                  </Text>
                  <Heading size="lg" color={headingColor} fontWeight="800" mt={1}>
                    {totalUsers}
                  </Heading>
                  <Text fontSize="xs" color={mutedTextColor} mt={1}>
                    Active staff accounts
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <Users size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
            <CardBody p={5}>
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="2xs" color="#52796F" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">
                    ADMINISTRATORS
                  </Text>
                  <Heading size="lg" color="#52796F" fontWeight="800" mt={1}>
                    {adminCount}
                  </Heading>
                  <Text fontSize="xs" color="#52796F" fontWeight="600" mt={1}>
                    Document upload & rule management power
                  </Text>
                </Box>
                <Box p={3} bg={adminBoxBg} color="#52796F" borderRadius="xl">
                  <ShieldCheck size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
            <CardBody p={5}>
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="2xs" color={mutedTextColor} fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">
                    COMPLIANCE MEMBERS
                  </Text>
                  <Heading size="lg" color={headingColor} fontWeight="800" mt={1}>
                    {employeeCount}
                  </Heading>
                  <Text fontSize="xs" color={mutedTextColor} mt={1}>
                    Standard compliance copilot inquiry access
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <UserCheck size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Add New User / Administrator Form Card */}
        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
          <CardBody p={6}>
            <Heading size="sm" color="#52796F" mb={2} display="flex" alignItems="center" gap={2} fontWeight="800">
              <UserPlus size={18} />
              <span>Create New Account / Grant Admin Authority</span>
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={5}>
              Fill in the credentials and assign a role. Creating an <strong>Administrator</strong> grants authority to upload statutory rulebooks and execute incremental diff syncs.
            </Text>

            <form onSubmit={handleCreateSubmit}>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4} align="flex-start" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                  <FormControl isRequired flex="1">
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Full Name</FormLabel>
                    <Input
                      placeholder="e.g. Rachel Adams"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="sm"
                      borderRadius="lg"
                      bg={inputBg}
                      borderColor={inputBorder}
                    />
                  </FormControl>

                  <FormControl isRequired flex="1">
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="rachel.adams@firm.co.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="sm"
                      borderRadius="lg"
                      bg={inputBg}
                      borderColor={inputBorder}
                    />
                  </FormControl>

                  <FormControl isRequired flex="1">
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Initial Password</FormLabel>
                    <InputGroup size="sm">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        borderRadius="lg"
                        bg={inputBg}
                        borderColor={inputBorder}
                        pr="2.2rem"
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          size="xs"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          color="#52796F"
                          _hover={{ bg: 'transparent', opacity: 0.75 }}
                          onClick={() => setShowPassword((prev) => !prev)}
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl flex="1">
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Department</FormLabel>
                    <Input
                      placeholder={role === 'ADMIN' ? 'Compliance Administration' : 'Finance & Compliance'}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      size="sm"
                      borderRadius="lg"
                      bg={inputBg}
                      borderColor={inputBorder}
                    />
                  </FormControl>
                </HStack>

                {/* Role Selector with explanatory callout */}
                <Box p={3.5} bg={formBoxBg} borderRadius="xl" border="1px solid" borderColor={formBoxBorder}>
                  <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
                    <Box>
                      <Text fontSize="xs" fontWeight="800" color={headingColor}>
                        Assigned System Role & Authority:
                      </Text>
                      <Text fontSize="2xs" color="#52796F" fontWeight="600" mt={0.5}>
                        {role === 'ADMIN'
                          ? '🛡️ Full Administrative Authority: Can upload new PDF/DOCX rules, trigger FCA Live syncs, manage versions, and add other admins.'
                          : '👤 Compliance Member: Can interact with the compliance chat copilot.'}
                      </Text>
                    </Box>

                    <RadioGroup onChange={setRole} value={role}>
                      <Stack direction="row" spacing={4}>
                        <Radio value="ADMIN" colorScheme="brand">
                          <Text fontSize="xs" fontWeight="700" color="#52796F">
                            Administrator (Full Admin Rights)
                          </Text>
                        </Radio>
                        <Radio value="EMPLOYEE" colorScheme="brand">
                          <Text fontSize="xs" fontWeight="700" color={headingColor}>
                            Compliance Member
                          </Text>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </HStack>
                </Box>

                <HStack justify="flex-end" pt={1}>
                  <Button
                    type="submit"
                    bg="#52796F"
                    color="white"
                    _hover={{ bg: '#43645C' }}
                    size="sm"
                    px={6}
                    isLoading={createMutation.isPending}
                    loadingText="Provisioning..."
                    fontWeight="700"
                    borderRadius="xl"
                  >
                    {role === 'ADMIN' ? '+ Provision Administrator Account' : '+ Create Member Account'}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* System Users Directory */}
        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
          <CardBody p={6}>
            <HStack justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
              <Box>
                <Heading size="sm" color={headingColor} fontWeight="800">
                  Registered Users & Administrators Directory ({filteredUsers.length})
                </Heading>
                <Text fontSize="xs" color={mutedTextColor} mt={0.5}>
                  Manage user accounts, promote compliance members to Administrators, or revoke administrative powers.
                </Text>
              </Box>

              {/* Search & Filter Controls */}
              <HStack spacing={3}>
                <HStack
                  bg={searchBg}
                  px={3}
                  py={1}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={searchBorder}
                  w={{ base: 'full', sm: '200px' }}
                >
                  <Search size={14} color="#52796F" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="unstyled"
                    fontSize="xs"
                  />
                </HStack>

                <Select
                  size="sm"
                  borderRadius="lg"
                  w="140px"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  fontSize="xs"
                  fontWeight="600"
                  borderColor={inputBorder}
                  bg={inputBg}
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admins Only</option>
                  <option value="EMPLOYEE">Members Only</option>
                </Select>
              </HStack>
            </HStack>

            {isLoading ? (
              <Center py={10}>
                <VStack spacing={3}>
                  <Spinner color="#52796F" thickness="3px" />
                  <Text fontSize="xs" color="gray.500">Loading system users...</Text>
                </VStack>
              </Center>
            ) : filteredUsers.length === 0 ? (
              <Box py={10} textAlign="center" color={mutedTextColor} bg={searchBg} borderRadius="xl">
                <Text fontSize="sm">No matching users found.</Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg={theadBg}>
                    <Tr>
                      <Th fontSize="10px" color="#52796F">USER</Th>
                      <Th fontSize="10px" color="#52796F">DEPARTMENT</Th>
                      <Th fontSize="10px" color="#52796F">CURRENT ROLE</Th>
                      <Th fontSize="10px" color="#52796F">STATUS</Th>
                      <Th fontSize="10px" color="#52796F">DATE CREATED</Th>
                      <Th fontSize="10px" color="#52796F" textAlign="right">ADMIN POWERS & ACTIONS</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((u) => {
                      const isSelf = currentUser?._id === u._id;
                      const isAdmin = u.role === 'ADMIN';

                      return (
                        <Tr key={u._id} _hover={{ bg: trHoverBg }} transition="all 0.15s">
                          <Td>
                            <HStack spacing={3}>
                              <Avatar
                                size="xs"
                                name={u.name}
                                bg={isAdmin ? '#52796F' : '#CAD7D0'}
                                color={isAdmin ? 'white' : '#2F3E46'}
                                fontWeight="700"
                              />
                              <Box>
                                <HStack spacing={2}>
                                  <Text fontWeight="700" fontSize="xs" color={headingColor}>
                                    {u.name}
                                  </Text>
                                  {isSelf && (
                                    <Badge bg={badgeEmpBg} color="#52796F" fontSize="9px" px={1.5} py={0.2} borderRadius="full">
                                      YOU
                                    </Badge>
                                  )}
                                </HStack>
                                <Text fontSize="2xs" color={mutedTextColor}>
                                  {u.email}
                                </Text>
                              </Box>
                            </HStack>
                          </Td>
                          <Td fontSize="xs" color={headingColor}>
                            {u.department || 'Compliance'}
                          </Td>
                          <Td>
                            {isAdmin ? (
                              <Badge bg="#52796F" color="white" px={2.5} py={0.5} borderRadius="md" fontSize="10px" fontWeight="800">
                                🛡️ ADMINISTRATOR
                              </Badge>
                            ) : (
                              <Badge bg={badgeEmpBg} color="#52796F" border="1px solid" borderColor={badgeEmpBorder} px={2} py={0.5} borderRadius="md" fontSize="10px" fontWeight="700">
                                MEMBER
                              </Badge>
                            )}
                          </Td>
                          <Td>
                            <Badge bg="#E8F5E9" color="#2E7D32" fontSize="10px" px={2} py={0.5} borderRadius="full">
                              ACTIVE
                            </Badge>
                          </Td>
                          <Td fontSize="xs" color={mutedTextColor}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </Td>
                          <Td textAlign="right">
                            <HStack spacing={2} justify="flex-end">
                              {!isAdmin ? (
                                <Tooltip label="Promote to Administrator (grants permission to upload and manage rules)" hasArrow>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    color="#52796F"
                                    borderColor={inputBorder}
                                    _hover={{ bg: iconBoxBg, borderColor: '#52796F' }}
                                    leftIcon={<ShieldCheck size={13} />}
                                    onClick={() =>
                                      setConfirmModal({
                                        isOpen: true,
                                        user: u,
                                        targetRole: 'ADMIN',
                                      })
                                    }
                                    fontWeight="700"
                                  >
                                    Promote to Admin
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Tooltip
                                  label={
                                    isSelf
                                      ? 'You cannot demote yourself'
                                      : adminCount <= 1
                                      ? 'Cannot demote the last remaining Administrator'
                                      : 'Demote to compliance member'
                                  }
                                  hasArrow
                                >
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    color={mutedTextColor}
                                    _hover={{ bg: iconBoxBg, color: headingColor }}
                                    leftIcon={<ArrowDownLeft size={13} />}
                                    isDisabled={isSelf || adminCount <= 1}
                                    onClick={() =>
                                      setConfirmModal({
                                        isOpen: true,
                                        user: u,
                                        targetRole: 'EMPLOYEE',
                                      })
                                    }
                                    fontWeight="600"
                                  >
                                    Demote to Member
                                  </Button>
                                </Tooltip>
                              )}

                              <Tooltip
                                label={
                                  isSelf
                                    ? 'Cannot delete your own account'
                                    : isAdmin && adminCount <= 1
                                    ? 'Cannot delete the only remaining Administrator'
                                    : 'Permanently remove account'
                                }
                                hasArrow
                              >
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  icon={<Trash2 size={13} />}
                                  isDisabled={isSelf || (isAdmin && adminCount <= 1)}
                                  onClick={() => setDeleteModal({ isOpen: true, user: u })}
                                  aria-label="Delete user"
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null, targetRole: null })}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" bg={cardBg} borderColor={cardBorder} border="1px solid">
          <ModalHeader color={headingColor} fontWeight="800">
            {confirmModal.targetRole === 'ADMIN' ? 'Grant Administrator Authority' : 'Revoke Administrator Authority'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="start">
              <Text fontSize="sm" color={subTextColor}>
                Are you sure you want to change the role for{' '}
                <strong>{confirmModal.user?.name}</strong> ({confirmModal.user?.email}) to{' '}
                <Badge
                  bg={confirmModal.targetRole === 'ADMIN' ? '#52796F' : badgeEmpBg}
                  color={confirmModal.targetRole === 'ADMIN' ? 'white' : '#52796F'}
                  px={2}
                >
                  {confirmModal.targetRole}
                </Badge>
                ?
              </Text>

              {confirmModal.targetRole === 'ADMIN' ? (
                <Box p={3} bg={formBoxBg} borderRadius="xl" border="1px solid" borderColor={formBoxBorder}>
                  <Text fontSize="xs" color="#52796F" fontWeight="700">
                    Authority Granted:
                  </Text>
                  <Text fontSize="2xs" color={headingColor} mt={1}>
                    This user will be able to upload new regulatory rulebooks (.pdf/.docx), update statutory versions, execute FCA live incremental diffs, and manage other administrators.
                  </Text>
                </Box>
              ) : (
                <Box p={3} bg={useColorModeValue('#FFF8E1', '#2A2000')} borderRadius="xl" border="1px solid" borderColor={useColorModeValue('#FFE082', '#4D3B00')}>
                  <Text fontSize="xs" color={useColorModeValue('#F57F17', '#FBBF24')} fontWeight="700">
                    Authority Removed:
                  </Text>
                  <Text fontSize="2xs" color={useColorModeValue('#795548', '#FDE68A')} mt={1}>
                    This user will no longer be able to upload documents or access administrator management consoles. They will be limited to copilot inquiry access.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setConfirmModal({ isOpen: false, user: null, targetRole: null })}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              bg="#52796F"
              color="white"
              _hover={{ bg: '#43645C' }}
              size="sm"
              isLoading={updateRoleMutation.isPending}
              onClick={() =>
                updateRoleMutation.mutate({
                  id: confirmModal.user._id,
                  targetRole: confirmModal.targetRole,
                })
              }
            >
              Confirm Role Change
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" bg={cardBg} borderColor={cardBorder} border="1px solid">
          <ModalHeader color="red.600" fontWeight="800">
            Delete User Account
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.700">
              Are you sure you want to permanently delete the account for{' '}
              <strong>{deleteModal.user?.name}</strong> ({deleteModal.user?.email})? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setDeleteModal({ isOpen: false, user: null })} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteModal.user._id)}
            >
              Delete Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
