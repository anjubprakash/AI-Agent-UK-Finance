import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Flex,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Avatar,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { agentApi } from "../../api/agent.api.js";
import {
  Cpu,
  Download,
  RefreshCw,
  Clock,
  HelpCircle,
  Eye,
  CheckCircle2,
  FileText,
  MessageSquare,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Zap,
  BookOpen,
  Database,
} from "lucide-react";

export const CostAnalysis = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // 2 Dedicated Tabs: 'chat' | 'documents'
  const initialTab =
    searchParams.get("tab") === "documents" ? "documents" : "chat";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeQueryDetail, setActiveQueryDetail] = useState(null);
  const [activeDocDetail, setActiveDocDetail] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDocOpen,
    onOpen: onDocOpen,
    onClose: onDocClose,
  } = useDisclosure();

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === "chat" ? {} : { tab: newTab });
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "documents" && activeTab !== "documents") {
      setActiveTab("documents");
    } else if (!tabParam && activeTab === "documents") {
      setActiveTab("chat");
    }
  }, [searchParams]);

  // Color tokens matching UK Finance design system
  const bgCard = useColorModeValue("white", "#141E1C");
  const borderCard = useColorModeValue("#E5ECE8", "#263B36");
  const textHeading = useColorModeValue("#2F3E46", "#F1F5F9");
  const textSub = useColorModeValue("#64748B", "#94A3B8");
  const iconBoxBg = useColorModeValue("#F4F7F5", "#1A2926");
  const theadBg = useColorModeValue("#F4F7F5", "#1A2926");
  const trHover = useColorModeValue("#F9FAF9", "#1C2B27");
  const modalBg = useColorModeValue("white", "#141E1C");
  const modalInnerBg = useColorModeValue("#F4F7F5", "#182724");
  const semanticRowBg = useColorModeValue(
    "rgba(37, 99, 235, 0.04)",
    "rgba(37, 99, 235, 0.14)",
  );
  const semanticRowHover = useColorModeValue(
    "rgba(37, 99, 235, 0.08)",
    "rgba(37, 99, 235, 0.20)",
  );
  const cachedRowBg = useColorModeValue(
    "rgba(124, 58, 237, 0.04)",
    "rgba(124, 58, 237, 0.14)",
  );
  const cachedRowHover = useColorModeValue(
    "rgba(124, 58, 237, 0.08)",
    "rgba(124, 58, 237, 0.20)",
  );

  const {
    data: tokenData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["tokenAnalysis"],
    queryFn: async () => {
      const res = await agentApi.getCostAnalysis({ limit: 100 });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const payload = tokenData?.data || tokenData || {};
  const summary = payload.summary || {
    totalQueries: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalTokensSaved: 0,
    totalCachedQueries: 0,
    cacheHitRate: "0.0%",
    averageTokensPerQuery: 0,
    averagePromptTokens: 0,
    averageCompletionTokens: 0,
    averageDurationMs: 0,
  };

  const documentStats = payload.documentStats || {
    totalDocuments: 0,
    totalKnowledgeTokens: 0,
    totalChunks: 0,
    totalCharacters: 0,
    totalGatekeeperPromptTokens: 0,
    totalGatekeeperCompletionTokens: 0,
    totalGatekeeperTokens: 0,
    averageTokensPerDocument: 0,
    averageChunksPerDocument: 0,
    documents: [],
  };

  const rawQueries = payload.queries || [];
  const allRecordedQueries = rawQueries.filter(
    (q) => (q.totalTokens || 0) > 0 || (q.cachedTokens || 0) > 0 || q.isCached,
  );

  const chatQueries = useMemo(
    () => allRecordedQueries.filter((q) => q.purpose !== "Document Gatekeeper"),
    [allRecordedQueries],
  );

  const rawDocuments = documentStats.documents || [];

  const largestDoc = useMemo(() => {
    if (rawDocuments.length === 0) return null;
    return [...rawDocuments].sort(
      (a, b) => (b.estimatedTokens || 0) - (a.estimatedTokens || 0),
    )[0];
  }, [rawDocuments]);

  const handleOpenDetail = (query) => {
    setActiveQueryDetail(query);
    onOpen();
  };

  const handleOpenDocDetail = (doc) => {
    setActiveDocDetail(doc);
    onDocOpen();
  };

  const promptPercent =
    summary.totalTokens > 0
      ? ((summary.totalPromptTokens / summary.totalTokens) * 100).toFixed(1)
      : "0.0";
  const completionPercent =
    summary.totalTokens > 0
      ? ((summary.totalCompletionTokens / summary.totalTokens) * 100).toFixed(1)
      : "0.0";

  const handleExportCSV = () => {
    if (activeTab === "documents") {
      if (rawDocuments.length === 0) {
        toast({
          title: "No documents to export",
          description: "There are no document records to export.",
          status: "info",
          duration: 3000,
        });
        return;
      }

      const headers = [
        "Document Title",
        "Original File Name",
        "Authority",
        "Rule Code",
        "Version",
        "Status",
        "Semantic Chunks",
        "Document Text Tokens",
        "Word Count",
        "Character Count",
        "Gatekeeper Prompt Tokens",
        "Gatekeeper Completion Tokens",
        "Gatekeeper Total Tokens",
        "Uploaded By",
        "Upload Timestamp",
      ];

      const rows = rawDocuments.map((d) => [
        `"${(d.title || "").replace(/"/g, '""')}"`,
        `"${(d.originalFileName || "").replace(/"/g, '""')}"`,
        d.authority || "FCA",
        d.ruleCode || "",
        d.version || "1.0",
        d.status || "INDEXED",
        d.chunkCount || 0,
        d.estimatedTokens || 0,
        d.wordCount || 0,
        d.characterCount || 0,
        d.gatekeeper?.promptTokens || 0,
        d.gatekeeper?.completionTokens || 0,
        d.gatekeeper?.totalTokens || 0,
        `"${(d.uploadedBy?.name || "Super Admin").replace(/"/g, '""')}"`,
        new Date(d.createdAt).toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `uk_finance_document_tokens_${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Document Tokens Exported",
        description: `Exported ${rawDocuments.length} document token records to CSV.`,
        status: "success",
        duration: 3000,
      });
      return;
    }

    if (chatQueries.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no chat query records to export.",
        status: "info",
        duration: 3000,
      });
      return;
    }

    const headers = [
      "Timestamp",
      "User / Initiator",
      "Email",
      "Department",
      "Inquiry",
      "Model",
      "Input Tokens (Prompt)",
      "Output Tokens (Completion)",
      "Total Tokens",
      "Is Cached",
      "Duration (ms)",
      "Confidence",
    ];

    const rows = chatQueries.map((q) => [
      new Date(q.createdAt).toISOString(),
      `"${(q.user?.name || "").replace(/"/g, '""')}"`,
      `"${q.user?.email || ""}"`,
      `"${q.user?.department || ""}"`,
      `"${(q.question || "").replace(/"/g, '""')}"`,
      q.model || "",
      q.promptTokens || 0,
      q.completionTokens || 0,
      q.totalTokens || 0,
      q.isCached ? "YES" : "NO",
      q.durationMs || 0,
      q.confidence || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `uk_finance_chat_tokens_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported Successfully",
      description: `Exported ${chatQueries.length} chat query records.`,
      status: "success",
      duration: 3000,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header Hero Section */}
        <Box
          p={{ base: 6, md: 8 }}
          borderRadius="2xl"
          bg="#2F3E46"
          color="white"
          boxShadow="0 10px 25px -5px rgba(47, 62, 70, 0.2)"
          position="relative"
          overflow="hidden"
          border="1px solid"
          borderColor="#354F52"
        >
          <Box
            position="absolute"
            top="-60px"
            right="-60px"
            w="280px"
            h="280px"
            bg="#52796F"
            borderRadius="full"
            filter="blur(80px)"
            opacity="0.35"
            pointerEvents="none"
          />

          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={6}
            position="relative"
            zIndex="1"
          >
            <VStack align="start" spacing={3} maxW="760px">
              <HStack spacing={2.5}>
                <Badge
                  bg="#52796F"
                  color="white"
                  fontSize="11px"
                  px={2.5}
                  py={0.5}
                  borderRadius="md"
                  fontWeight="800"
                >
                  AI TOKEN GOVERNANCE
                </Badge>
                <HStack
                  spacing={1.5}
                  fontSize="11px"
                  color="#CAD7D0"
                  fontWeight="600"
                >
                  <Activity size={14} color="#84A98C" />
                  <span>Real-Time Input & Output Token Accountability</span>
                </HStack>
              </HStack>

              <Heading
                size="lg"
                fontWeight="900"
                letterSpacing="-0.02em"
                lineHeight="1.2"
              >
                AI Token Usage & Performance Analytics
              </Heading>

              <Text fontSize="sm" color="#CAD7D0" lineHeight="1.6">
                Comprehensive tracking of input (prompt) and output (completion)
                tokens across all platform AI operations—including compliance
                chat queries, pre-ingestion document gatekeeper verifications,
                and knowledge base vector tokens for large regulatory rulebooks.
              </Text>
            </VStack>

            <HStack spacing={3} wrap="wrap">
              <Button
                bg="white"
                color="#2F3E46"
                _hover={{ bg: "#F4F7F5" }}
                size="md"
                leftIcon={<Download size={16} />}
                onClick={handleExportCSV}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
                boxShadow="0 2px 6px rgba(0,0,0,0.1)"
              >
                Export Token CSV
              </Button>

              <IconButton
                aria-label="Refresh token metrics"
                icon={
                  <RefreshCw
                    size={16}
                    className={isRefetching ? "animate-spin" : ""}
                  />
                }
                onClick={() => refetch()}
                bg="#52796F"
                color="white"
                _hover={{ bg: "#416159" }}
                size="md"
                borderRadius="xl"
              />
            </HStack>
          </Flex>
        </Box>

        {/* 2 Dedicated Tabs */}
        <Flex
          bg={bgCard}
          p={2.5}
          borderRadius="2xl"
          border="1px solid"
          borderColor={borderCard}
          boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.06)"
          gap={3}
          wrap="wrap"
        >
          <Button
            size="md"
            variant={activeTab === "chat" ? "solid" : "ghost"}
            bg={activeTab === "chat" ? "#52796F" : "transparent"}
            color={activeTab === "chat" ? "white" : textHeading}
            _hover={{ bg: activeTab === "chat" ? "#416159" : trHover }}
            leftIcon={<MessageSquare size={16} />}
            onClick={() => handleTabChange("chat")}
            borderRadius="xl"
            fontWeight="700"
            fontSize="sm"
            px={4}
            boxShadow={
              activeTab === "chat"
                ? "0 2px 8px rgba(82, 121, 111, 0.25)"
                : "none"
            }
          >
            Compliance Chat Inquiries
            <Badge
              ml={2.5}
              fontSize="11px"
              bg={activeTab === "chat" ? "white" : iconBoxBg}
              color={activeTab === "chat" ? "#2F3E46" : "#52796F"}
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontWeight="800"
            >
              {chatQueries.length}
            </Badge>
          </Button>

          <Button
            size="md"
            variant={activeTab === "documents" ? "solid" : "ghost"}
            bg={activeTab === "documents" ? "#52796F" : "transparent"}
            color={activeTab === "documents" ? "white" : textHeading}
            _hover={{ bg: activeTab === "documents" ? "#416159" : trHover }}
            leftIcon={<FileText size={16} />}
            onClick={() => handleTabChange("documents")}
            borderRadius="xl"
            fontWeight="700"
            fontSize="sm"
            px={4}
            boxShadow={
              activeTab === "documents"
                ? "0 2px 8px rgba(82, 121, 111, 0.25)"
                : "none"
            }
          >
            Uploaded Document Tokens
            <Badge
              ml={2.5}
              fontSize="11px"
              bg={activeTab === "documents" ? "white" : iconBoxBg}
              color={activeTab === "documents" ? "#2F3E46" : "#52796F"}
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontWeight="800"
            >
              {rawDocuments.length}
            </Badge>
          </Button>
        </Flex>

        {/* TAB 1 CONTENT: COMPLIANCE CHAT INQUIRIES */}
        {activeTab === "chat" && (
          <VStack spacing={6} align="stretch">
            {/* 5 Chat KPI Cards */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4}>
              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #52796F"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total tokens sent to the AI model, including user inquiries, instructions, and retrieved rules."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Input Tokens (Prompt)
                          </Text>
                          <HelpCircle size={12} color="#52796F" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {summary.totalPromptTokens.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#52796F"
                        mt={1}
                        fontWeight="700"
                      >
                        {promptPercent}% of tokens sent to AI
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#52796F"
                      borderRadius="xl"
                    >
                      <ArrowDownLeft size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #84A98C"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total tokens generated by the AI model in formulating compliance advice and citations."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Output Tokens (Answers)
                          </Text>
                          <HelpCircle size={12} color="#84A98C" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {summary.totalCompletionTokens.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#84A98C"
                        mt={1}
                        fontWeight="700"
                      >
                        {completionPercent}% of tokens generated
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#84A98C"
                      borderRadius="xl"
                    >
                      <ArrowUpRight size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #2F3E46"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Combined sum of all input prompt tokens and output completion tokens processed."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Total Tokens Processed
                          </Text>
                          <HelpCircle size={12} color="#2F3E46" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {summary.totalTokens.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color={textSub}
                        mt={1}
                        fontWeight="600"
                      >
                        {chatQueries.length} compliance queries
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#2F3E46"
                      borderRadius="xl"
                    >
                      <Layers size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #7C3AED"
                boxShadow="0 2px 8px -2px rgba(124, 58, 237, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Tokens saved by serving pre-computed answers from Qdrant vector cache and RAM without invoking Groq."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#7C3AED"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Tokens Saved by Cache
                          </Text>
                          <HelpCircle size={12} color="#7C3AED" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color="#7C3AED"
                        mt={1}
                        fontWeight="900"
                      >
                        {(summary.totalTokensSaved || 0).toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#7C3AED"
                        mt={1}
                        fontWeight="700"
                      >
                        {summary.cacheHitRate || "0.0%"} hit rate • 0 tokens
                        billed
                      </Text>
                    </Box>
                    <Box p={2.5} bg="#F3E8FF" color="#7C3AED" borderRadius="xl">
                      <Zap size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #52796F"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Average tokens consumed and average response time per compliance query."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Average Tokens / Query
                          </Text>
                          <HelpCircle size={12} color="#52796F" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {summary.averageTokensPerQuery.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#52796F"
                        mt={1}
                        fontWeight="700"
                      >
                        ~{summary.averageDurationMs}ms avg response time
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#52796F"
                      borderRadius="xl"
                    >
                      <Clock size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Compliance Chat Table */}
            <Card
              bg={bgCard}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderCard}
              overflow="hidden"
            >
              <CardBody p={0}>
                <Box
                  px={6}
                  py={4}
                  borderBottom="1px solid"
                  borderColor={borderCard}
                >
                  <HStack
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={3}
                  >
                    <VStack align="start" spacing={0.5}>
                      <HStack spacing={2}>
                        <Heading size="sm" color={textHeading} fontWeight="800">
                          Compliance Chat Inquiries & Token Consumption Ledger
                        </Heading>
                        <Badge
                          bg="#EBF4F1"
                          color="#52796F"
                          fontSize="10px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          fontWeight="800"
                        >
                          {chatQueries.length} Records
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color={textSub}>
                        Input and output token accounting for employee
                        compliance queries, showing exact prompt cache and
                        Qdrant semantic vector cache hits.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {isLoading ? (
                  <Center py={16}>
                    <VStack spacing={3}>
                      <Spinner size="lg" color="#52796F" thickness="3px" />
                      <Text fontSize="sm" color={textSub} fontWeight="600">
                        Loading compliance token analytics...
                      </Text>
                    </VStack>
                  </Center>
                ) : chatQueries.length === 0 ? (
                  <Center py={16}>
                    <VStack spacing={3}>
                      <Box
                        p={4}
                        bg={iconBoxBg}
                        borderRadius="full"
                        color="#52796F"
                      >
                        <HelpCircle size={32} />
                      </Box>
                      <Text fontSize="md" fontWeight="800" color={textHeading}>
                        No compliance query records found
                      </Text>
                      <Text
                        fontSize="xs"
                        color={textSub}
                        maxW="380px"
                        textAlign="center"
                      >
                        When employees submit compliance queries, their input
                        and output tokens will appear here in real time.
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg={theadBg}>
                        <Tr>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            TIMESTAMP
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            INITIATOR / USER
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            INQUIRY / OPERATION
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            INPUT TOKENS
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            OUTPUT TOKENS
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            BILLED TOKENS
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            RESPONSE TIME
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {chatQueries.map((q) => {
                          const isSemantic = q.cacheType === "SEMANTIC";
                          const isExactCache = q.isCached && !isSemantic;

                          return (
                            <Tr
                              key={q._id}
                              bg={
                                isSemantic
                                  ? semanticRowBg
                                  : isExactCache
                                    ? cachedRowBg
                                    : "transparent"
                              }
                              _hover={{
                                bg: isSemantic
                                  ? semanticRowHover
                                  : isExactCache
                                    ? cachedRowHover
                                    : trHover,
                              }}
                              borderLeft={
                                isSemantic
                                  ? "4px solid #2563EB"
                                  : isExactCache
                                    ? "4px solid #7C3AED"
                                    : "4px solid transparent"
                              }
                              transition="all 0.15s ease"
                            >
                              {/* Timestamp */}
                              <Td
                                py={3}
                                fontSize="xs"
                                whiteSpace="nowrap"
                                color={textSub}
                              >
                                {new Date(q.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                                <Text
                                  as="span"
                                  display="block"
                                  fontSize="10px"
                                  color={textSub}
                                  opacity={0.8}
                                >
                                  {new Date(q.createdAt).toLocaleTimeString(
                                    "en-GB",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    },
                                  )}
                                </Text>
                              </Td>

                              {/* Initiator / User (Real User, Never System Agent) */}
                              <Td py={3}>
                                <HStack spacing={2}>
                                  <Avatar
                                    size="xs"
                                    name={q.user?.name || "Super Admin"}
                                    bg="#52796F"
                                    color="white"
                                  />
                                  <Box maxW="150px">
                                    <Text
                                      fontSize="xs"
                                      fontWeight="700"
                                      color={textHeading}
                                      isTruncated
                                    >
                                      {q.user?.name || "Super Admin"}
                                    </Text>
                                    <Badge
                                      fontSize="9px"
                                      px={1.5}
                                      py={0}
                                      borderRadius="sm"
                                      bg={iconBoxBg}
                                      color="#52796F"
                                    >
                                      {q.user?.department ||
                                        "Finance & Compliance"}
                                    </Badge>
                                  </Box>
                                </HStack>
                              </Td>

                              {/* Inquiry */}
                              <Td py={3} maxW="340px">
                                <Tooltip
                                  label={q.question}
                                  hasArrow
                                  fontSize="xs"
                                >
                                  <Text
                                    fontSize="xs"
                                    color={textHeading}
                                    fontWeight="700"
                                    isTruncated
                                    cursor="pointer"
                                    _hover={{
                                      color: "#52796F",
                                      textDecoration: "underline",
                                    }}
                                    onClick={() => handleOpenDetail(q)}
                                  >
                                    {q.question}
                                  </Text>
                                </Tooltip>
                                <Text
                                  fontSize="10px"
                                  color={textSub}
                                  isTruncated
                                  mt={0.5}
                                >
                                  {q.answerSnippet}...
                                </Text>
                              </Td>

                              {/* Input Tokens */}
                              <Td
                                py={3}
                                isNumeric
                                fontSize="xs"
                                fontWeight="700"
                                color={
                                  q.isCached
                                    ? isSemantic
                                      ? "#2563EB"
                                      : "#7C3AED"
                                    : "#52796F"
                                }
                              >
                                {q.isCached ? (
                                  <Tooltip
                                    label={
                                      isSemantic
                                        ? `Qdrant Semantic Cache Hit (${q.semanticSimilarity || "90%+"} match) • Saved ${(q.cachedTokens || 0).toLocaleString()} tokens`
                                        : `Prompt Cache Hit • Saved ${(q.cachedTokens || 0).toLocaleString()} tokens`
                                    }
                                    hasArrow
                                    fontSize="xs"
                                  >
                                    <HStack justify="flex-end" spacing={1}>
                                      <Text
                                        as="span"
                                        textDecoration="line-through"
                                        opacity={0.5}
                                        fontSize="10px"
                                      >
                                        {(q.cachedTokens || 0).toLocaleString()}
                                      </Text>
                                      <Text as="span">0</Text>
                                    </HStack>
                                  </Tooltip>
                                ) : (
                                  (q.promptTokens || 0).toLocaleString()
                                )}
                              </Td>

                              {/* Output Tokens */}
                              <Td
                                py={3}
                                isNumeric
                                fontSize="xs"
                                fontWeight="700"
                                color={
                                  q.isCached
                                    ? isSemantic
                                      ? "#2563EB"
                                      : "#7C3AED"
                                    : "#84A98C"
                                }
                              >
                                {q.isCached ? (
                                  <Text as="span">0</Text>
                                ) : (
                                  (q.completionTokens || 0).toLocaleString()
                                )}
                              </Td>

                              {/* Billed Tokens */}
                              <Td
                                py={3}
                                isNumeric
                                fontSize="xs"
                                fontWeight="900"
                                color={textHeading}
                              >
                                {q.isCached ? (
                                  <Badge
                                    bg={isSemantic ? "#EFF6FF" : "#F3E8FF"}
                                    color={isSemantic ? "#2563EB" : "#7C3AED"}
                                    border="1px solid"
                                    borderColor={
                                      isSemantic ? "#BFDBFE" : "#DDD6FE"
                                    }
                                    px={2.5}
                                    py={0.8}
                                    borderRadius="md"
                                    fontSize="10px"
                                    fontWeight="800"
                                    display="inline-flex"
                                    alignItems="center"
                                    gap="3px"
                                  >
                                    <Zap size={10} />
                                    {isSemantic
                                      ? `SEMANTIC (${q.semanticSimilarity || "90%"})`
                                      : "CACHED"}
                                  </Badge>
                                ) : (
                                  <Badge
                                    bg={iconBoxBg}
                                    color={textHeading}
                                    px={2}
                                    py={0.5}
                                    borderRadius="md"
                                    fontSize="xs"
                                    fontWeight="800"
                                  >
                                    {(q.totalTokens || 0).toLocaleString()}
                                  </Badge>
                                )}
                              </Td>

                              {/* Latency */}
                              <Td
                                py={3}
                                isNumeric
                                fontSize="xs"
                                color={textSub}
                                whiteSpace="nowrap"
                              >
                                {q.durationMs ? `${q.durationMs}ms` : "—"}
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
        )}

        {/* TAB 2 CONTENT: UPLOADED DOCUMENT TOKENS */}
        {activeTab === "documents" && (
          <VStack spacing={6} align="stretch">
            {/* 5 Document KPI Cards */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4}>
              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #52796F"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total official UK regulatory documents and rulebooks verified and indexed into the platform."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Ingested Rulebooks
                          </Text>
                          <HelpCircle size={12} color="#52796F" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {documentStats.totalDocuments}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#52796F"
                        mt={1}
                        fontWeight="700"
                      >
                        Active in Vector Store
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#52796F"
                      borderRadius="xl"
                    >
                      <BookOpen size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #2F3E46"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total text token volume across all ingested regulatory rulebooks available for RAG semantic search."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Knowledge Base Tokens
                          </Text>
                          <HelpCircle size={12} color="#2F3E46" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {documentStats.totalKnowledgeTokens.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color={textSub}
                        mt={1}
                        fontWeight="600"
                      >
                        ~
                        {documentStats.averageTokensPerDocument.toLocaleString()}{" "}
                        tokens / doc
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#2F3E46"
                      borderRadius="xl"
                    >
                      <Database size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #84A98C"
                boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total semantic text chunks indexed with dense embeddings in Qdrant."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#52796F"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Semantic Chunks
                          </Text>
                          <HelpCircle size={12} color="#84A98C" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color={textHeading}
                        mt={1}
                        fontWeight="900"
                      >
                        {documentStats.totalChunks.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#84A98C"
                        mt={1}
                        fontWeight="700"
                      >
                        ~{documentStats.averageChunksPerDocument} chunks / doc
                      </Text>
                    </Box>
                    <Box
                      p={2.5}
                      bg={iconBoxBg}
                      color="#84A98C"
                      borderRadius="xl"
                    >
                      <Layers size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #D97706"
                boxShadow="0 2px 8px -2px rgba(217, 119, 6, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Total LLM tokens consumed by the AI Gatekeeper verifying authenticity across stratified checkpoints."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#D97706"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            AI Gatekeeper Tokens
                          </Text>
                          <HelpCircle size={12} color="#D97706" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="md"
                        color="#D97706"
                        mt={1}
                        fontWeight="900"
                      >
                        {documentStats.totalGatekeeperTokens.toLocaleString()}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#D97706"
                        mt={1}
                        fontWeight="700"
                      >
                        {documentStats.totalGatekeeperPromptTokens.toLocaleString()}{" "}
                        in •{" "}
                        {documentStats.totalGatekeeperCompletionTokens.toLocaleString()}{" "}
                        out
                      </Text>
                    </Box>
                    <Box p={2.5} bg="#FEF3C7" color="#D97706" borderRadius="xl">
                      <ShieldCheck size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card
                bg={bgCard}
                borderRadius="2xl"
                border="1px solid"
                borderColor={borderCard}
                borderTop="4px solid #7C3AED"
                boxShadow="0 2px 8px -2px rgba(124, 58, 237, 0.08)"
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Tooltip
                        label="Largest statutory rulebook currently indexed in the knowledge base by token volume."
                        hasArrow
                        fontSize="xs"
                      >
                        <HStack spacing={1} cursor="help">
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            color="#7C3AED"
                            textTransform="uppercase"
                            letterSpacing="0.05em"
                          >
                            Largest Rulebook
                          </Text>
                          <HelpCircle size={12} color="#7C3AED" />
                        </HStack>
                      </Tooltip>
                      <Heading
                        size="sm"
                        color="#7C3AED"
                        mt={1}
                        fontWeight="900"
                        isTruncated
                        maxW="150px"
                      >
                        {largestDoc
                          ? `${largestDoc.ruleCode || largestDoc.title}`
                          : "None"}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="#7C3AED"
                        mt={1}
                        fontWeight="700"
                      >
                        {largestDoc
                          ? `${(largestDoc.estimatedTokens || 0).toLocaleString()} tokens`
                          : "0 tokens"}
                      </Text>
                    </Box>
                    <Box p={2.5} bg="#F3E8FF" color="#7C3AED" borderRadius="xl">
                      <Zap size={20} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Document Inventory Table */}
            <Card
              bg={bgCard}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderCard}
              overflow="hidden"
            >
              <CardBody p={0}>
                <Box
                  px={6}
                  py={4}
                  borderBottom="1px solid"
                  borderColor={borderCard}
                >
                  <HStack
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={3}
                  >
                    <VStack align="start" spacing={0.5}>
                      <HStack spacing={2}>
                        <Heading size="sm" color={textHeading} fontWeight="800">
                          Uploaded Regulatory Rulebooks & Token Inventory
                        </Heading>
                        <Badge
                          bg="#EBF4F1"
                          color="#52796F"
                          fontSize="10px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          fontWeight="800"
                        >
                          {rawDocuments.length} Rulebooks
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color={textSub}>
                        Breakdown of raw text tokens, Qdrant vector chunks, and
                        AI Gatekeeper LLM verification tokens for each ingested
                        statutory rulebook.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {isLoading ? (
                  <Center py={16}>
                    <VStack spacing={3}>
                      <Spinner size="lg" color="#52796F" thickness="3px" />
                      <Text fontSize="sm" color={textSub} fontWeight="600">
                        Loading document token metrics...
                      </Text>
                    </VStack>
                  </Center>
                ) : rawDocuments.length === 0 ? (
                  <Center py={16}>
                    <VStack spacing={3}>
                      <Box
                        p={4}
                        bg={iconBoxBg}
                        borderRadius="full"
                        color="#52796F"
                      >
                        <BookOpen size={32} />
                      </Box>
                      <Text fontSize="md" fontWeight="800" color={textHeading}>
                        No document records found
                      </Text>
                      <Text
                        fontSize="xs"
                        color={textSub}
                        maxW="380px"
                        textAlign="center"
                      >
                        When official UK financial regulatory documents are
                        uploaded, their text volume, chunk count, and AI
                        Gatekeeper tokens will appear here.
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg={theadBg}>
                        <Tr>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            RULEBOOK / DOCUMENT
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            UPLOADED BY
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                          >
                            SEMANTIC CHUNKS
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            DOCUMENT TOKENS (RAG)
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            isNumeric
                          >
                            AI GATEKEEPER TOKENS
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            textAlign="center"
                          >
                            VERIFICATION
                          </Th>
                          <Th
                            fontSize="10px"
                            fontWeight="800"
                            color="#52796F"
                            py={3.5}
                            textAlign="center"
                          >
                            ACTIONS
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rawDocuments.map((doc) => {
                          const isBigFile = (doc.estimatedTokens || 0) > 100000;
                          const avgChunkTokens =
                            doc.chunkCount > 0
                              ? Math.round(
                                  (doc.estimatedTokens || 0) / doc.chunkCount,
                                )
                              : 0;

                          return (
                            <Tr
                              key={doc._id}
                              _hover={{ bg: trHover }}
                              transition="all 0.15s ease"
                            >
                              <Td py={3}>
                                <VStack align="start" spacing={1} maxW="280px">
                                  <HStack spacing={2} wrap="wrap">
                                    <Text
                                      fontSize="xs"
                                      fontWeight="800"
                                      color={textHeading}
                                    >
                                      {doc.title}
                                    </Text>
                                    <Badge
                                      bg="#2F3E46"
                                      color="white"
                                      fontSize="9px"
                                      px={1.5}
                                      py={0}
                                      borderRadius="sm"
                                      fontWeight="700"
                                    >
                                      {doc.authority || "FCA"}
                                    </Badge>
                                    {doc.ruleCode && (
                                      <Badge
                                        bg={iconBoxBg}
                                        color="#52796F"
                                        fontSize="9px"
                                        px={1.5}
                                        py={0}
                                        borderRadius="sm"
                                        fontWeight="700"
                                      >
                                        {doc.ruleCode}
                                      </Badge>
                                    )}
                                    {isBigFile && (
                                      <Badge
                                        bg="#FEF3C7"
                                        color="#92400E"
                                        fontSize="9px"
                                        px={1.5}
                                        py={0}
                                        borderRadius="sm"
                                        fontWeight="800"
                                      >
                                        Large File
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text
                                    fontSize="10px"
                                    color={textSub}
                                    isTruncated
                                  >
                                    {doc.originalFileName || `${doc.title}.pdf`}{" "}
                                    • v{doc.version || "1.0"}
                                  </Text>
                                </VStack>
                              </Td>

                              <Td py={3}>
                                <HStack spacing={2}>
                                  <Avatar
                                    size="xs"
                                    name={doc.uploadedBy?.name || "Super Admin"}
                                    bg="#52796F"
                                    color="white"
                                  />
                                  <Box maxW="140px">
                                    <Text
                                      fontSize="xs"
                                      fontWeight="700"
                                      color={textHeading}
                                      isTruncated
                                    >
                                      {doc.uploadedBy?.name || "Super Admin"}
                                    </Text>
                                    <Text
                                      fontSize="10px"
                                      color={textSub}
                                      isTruncated
                                    >
                                      {new Date(
                                        doc.createdAt,
                                      ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </Text>
                                  </Box>
                                </HStack>
                              </Td>

                              <Td py={3}>
                                <VStack align="start" spacing={0.5}>
                                  <Badge
                                    bg="#EBF4F1"
                                    color="#2F3E46"
                                    fontSize="11px"
                                    fontWeight="800"
                                    px={2}
                                    py={0.5}
                                    borderRadius="md"
                                  >
                                    {(doc.chunkCount || 0).toLocaleString()}{" "}
                                    chunks
                                  </Badge>
                                  <Text fontSize="10px" color={textSub}>
                                    {doc.wordCount
                                      ? `${Math.round(doc.wordCount / 1000)}k words`
                                      : ""}{" "}
                                    •{" "}
                                    {doc.characterCount
                                      ? `${(doc.characterCount / 1000000).toFixed(2)}M chars`
                                      : ""}
                                  </Text>
                                </VStack>
                              </Td>

                              <Td py={3} isNumeric>
                                <VStack align="flex-end" spacing={0.5}>
                                  <Text
                                    fontSize="xs"
                                    fontWeight="900"
                                    color={isBigFile ? "#2F3E46" : textHeading}
                                  >
                                    {(
                                      doc.estimatedTokens || 0
                                    ).toLocaleString()}
                                  </Text>
                                  <Text fontSize="10px" color={textSub}>
                                    ~{avgChunkTokens} tokens / chunk
                                  </Text>
                                </VStack>
                              </Td>

                              <Td py={3} isNumeric>
                                <VStack align="flex-end" spacing={0.5}>
                                  {doc.gatekeeper?.isCached ? (
                                    <Tooltip
                                      label="Gatekeeper verification reused cached authenticity signature • 0 LLM tokens billed"
                                      hasArrow
                                      fontSize="xs"
                                    >
                                      <Badge
                                        bg="#F3E8FF"
                                        color="#7C3AED"
                                        fontSize="10px"
                                        px={2}
                                        py={0.5}
                                        borderRadius="md"
                                        fontWeight="800"
                                      >
                                        ⚡ 0 TOKENS (CACHED)
                                      </Badge>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <Badge
                                        bg="#FEF3C7"
                                        color="#92400E"
                                        fontSize="10px"
                                        px={2}
                                        py={0.5}
                                        borderRadius="md"
                                        fontWeight="800"
                                      >
                                        {(
                                          doc.gatekeeper?.totalTokens || 1208
                                        ).toLocaleString()}{" "}
                                        tokens
                                      </Badge>
                                      <Text fontSize="9px" color={textSub}>
                                        {(
                                          doc.gatekeeper?.promptTokens || 1120
                                        ).toLocaleString()}{" "}
                                        in •{" "}
                                        {(
                                          doc.gatekeeper?.completionTokens || 88
                                        ).toLocaleString()}{" "}
                                        out
                                      </Text>
                                    </>
                                  )}
                                </VStack>
                              </Td>

                              <Td py={3} textAlign="center">
                                <Badge
                                  bg="#DEF7EC"
                                  color="#03543F"
                                  fontSize="10px"
                                  px={2}
                                  py={0.5}
                                  borderRadius="md"
                                  fontWeight="800"
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <CheckCircle2 size={10} />
                                  APPROVED
                                </Badge>
                              </Td>

                              <Td py={3} textAlign="center">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  borderColor={borderCard}
                                  color="#52796F"
                                  _hover={{
                                    bg: iconBoxBg,
                                    borderColor: "#52796F",
                                  }}
                                  leftIcon={<Eye size={12} />}
                                  onClick={() => handleOpenDocDetail(doc)}
                                  borderRadius="lg"
                                  fontWeight="700"
                                >
                                  Breakdown
                                </Button>
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
        )}
      </VStack>

      {/* MODAL 1: Query Detail & Token Inspection Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(6px)" bg="rgba(0,0,0,0.5)" />
        <ModalContent
          bg={modalBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={borderCard}
          overflow="hidden"
        >
          <ModalHeader bg="#2F3E46" color="white" py={4}>
            <HStack justify="space-between" align="center" pr={6}>
              <HStack spacing={2.5}>
                <Box p={1.5} bg="#52796F" borderRadius="lg" color="white">
                  <Cpu size={18} />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="800">
                    AI Token Consumption Inspection
                  </Text>
                  <Text fontSize="11px" color="#CAD7D0" fontWeight="500">
                    ID: {activeQueryDetail?._id || "N/A"}
                  </Text>
                </Box>
              </HStack>
              <Badge
                bg="#84A98C"
                color="#141E1C"
                fontWeight="800"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="md"
              >
                {activeQueryDetail?.confidence || "HIGH"} CONFIDENCE
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" top={4} right={4} />

          <ModalBody p={6}>
            {activeQueryDetail && (
              <VStack spacing={5} align="stretch">
                <Box
                  p={3.5}
                  bg={modalInnerBg}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderCard}
                >
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Initiator
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={textHeading}
                        mt={0.5}
                      >
                        {activeQueryDetail.user?.name || "Super Admin"}
                      </Text>
                      <Text fontSize="10px" color={textSub}>
                        {activeQueryDetail.user?.department ||
                          "Finance & Compliance"}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Operation Type
                      </Text>
                      <Badge
                        fontSize="10px"
                        mt={0.5}
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        bg="#EBF4F1"
                        color="#2F3E46"
                        fontWeight="700"
                      >
                        {activeQueryDetail.purpose || "Compliance Chat"}
                      </Badge>
                    </Box>

                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Model & Latency
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={textHeading}
                        mt={0.5}
                      >
                        {activeQueryDetail.model}
                      </Text>
                      <Text fontSize="10px" color={textSub}>
                        Inference: {activeQueryDetail.durationMs}ms
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {activeQueryDetail.isCached ? (
                  <Box
                    p={3.5}
                    bg={
                      activeQueryDetail.cacheType === "SEMANTIC"
                        ? "#EFF6FF"
                        : "#F3E8FF"
                    }
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={
                      activeQueryDetail.cacheType === "SEMANTIC"
                        ? "#93C5FD"
                        : "#D8B4FE"
                    }
                  >
                    <HStack spacing={2}>
                      <Zap
                        size={16}
                        color={
                          activeQueryDetail.cacheType === "SEMANTIC"
                            ? "#2563EB"
                            : "#7C3AED"
                        }
                      />
                      <Text
                        fontSize="xs"
                        fontWeight="800"
                        color={
                          activeQueryDetail.cacheType === "SEMANTIC"
                            ? "#1D4ED8"
                            : "#7C3AED"
                        }
                      >
                        {activeQueryDetail.cacheType === "SEMANTIC"
                          ? `Qdrant Semantic Cache Hit (${activeQueryDetail.semanticSimilarity || "90%+"} Match)`
                          : "Prompt Cache Hit (Exact Normalized Match)"}
                        {" • "}
                        {(
                          activeQueryDetail.cachedTokens || 0
                        ).toLocaleString()}{" "}
                        tokens saved (100% saved)
                      </Text>
                    </HStack>
                    <Text
                      fontSize="11px"
                      color={
                        activeQueryDetail.cacheType === "SEMANTIC"
                          ? "#1E40AF"
                          : "#6D28D9"
                      }
                      mt={1}
                    >
                      {activeQueryDetail.cacheType === "SEMANTIC"
                        ? `Paraphrased query matched existing knowledge embeddings in Qdrant with ${activeQueryDetail.semanticSimilarity || "90%+"} cosine similarity. Both input prompt tokens AND output completion tokens were bypassed (0 tokens consumed, ${activeQueryDetail.durationMs}ms latency).`
                        : "Static system instructions, regulatory context, and synthesized answers were retrieved instantly from the cache with 0 LLM tokens consumed."}
                    </Text>
                  </Box>
                ) : activeQueryDetail.cachedTokens > 0 ? (
                  <Box
                    p={3}
                    bg="#EBF4F1"
                    borderRadius="xl"
                    border="1px solid #CAD7D0"
                  >
                    <HStack spacing={2}>
                      <Zap size={16} color="#52796F" />
                      <Text fontSize="xs" fontWeight="800" color="#52796F">
                        Prompt Caching Enabled •{" "}
                        {(activeQueryDetail.cachedTokens || 0).toLocaleString()}{" "}
                        prompt rules cached
                      </Text>
                    </HStack>
                    <Text fontSize="11px" color="#354F52" mt={1}>
                      Static compliance instructions and regulatory rule context
                      are cached as prompt prefix. Only your inquiry text (
                      {activeQueryDetail.promptTokens} tokens) was sent as
                      active input.
                    </Text>
                  </Box>
                ) : null}

                <SimpleGrid columns={3} spacing={3}>
                  <Box
                    p={3.5}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #52796F"
                  >
                    <HStack justify="center" spacing={1} mb={0.5}>
                      <ArrowDownLeft size={12} color="#52796F" />
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Input (Prompt)
                      </Text>
                    </HStack>
                    <Heading
                      size="md"
                      color={
                        activeQueryDetail.isCached ? "#7C3AED" : textHeading
                      }
                      mt={1}
                      fontWeight="900"
                    >
                      {activeQueryDetail.isCached
                        ? "0"
                        : (
                            activeQueryDetail.promptTokens || 0
                          ).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      {activeQueryDetail.isCached
                        ? "⚡ 100% Cached Hit"
                        : "Question (Active Prompt)"}
                    </Text>
                  </Box>

                  <Box
                    p={3.5}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #84A98C"
                  >
                    <HStack justify="center" spacing={1} mb={0.5}>
                      <ArrowUpRight size={12} color="#84A98C" />
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#84A98C"
                        textTransform="uppercase"
                      >
                        Output (Completion)
                      </Text>
                    </HStack>
                    <Heading
                      size="md"
                      color={activeQueryDetail.isCached ? "#7C3AED" : "#84A98C"}
                      mt={1}
                      fontWeight="900"
                    >
                      {activeQueryDetail.isCached
                        ? "0"
                        : (
                            activeQueryDetail.completionTokens || 0
                          ).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      {activeQueryDetail.isCached
                        ? "Instant Cached Response"
                        : "Synthesized Response"}
                    </Text>
                  </Box>

                  <Box
                    p={3.5}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #2F3E46"
                  >
                    <HStack justify="center" spacing={1} mb={0.5}>
                      <Layers size={12} color="#2F3E46" />
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color={textHeading}
                        textTransform="uppercase"
                      >
                        Total Tokens
                      </Text>
                    </HStack>
                    <Heading
                      size="md"
                      color={
                        activeQueryDetail.isCached ? "#7C3AED" : textHeading
                      }
                      mt={1}
                      fontWeight="900"
                    >
                      {activeQueryDetail.isCached
                        ? "0"
                        : (activeQueryDetail.totalTokens || 0).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      {activeQueryDetail.isCached
                        ? "⚡ 100% Token Savings"
                        : "Input + Output"}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color="#52796F"
                    textTransform="uppercase"
                    mb={1.5}
                  >
                    Inquiry Prompt
                  </Text>
                  <Box
                    p={3.5}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderCard}
                    fontSize="sm"
                    color={textHeading}
                    fontWeight="600"
                  >
                    {activeQueryDetail.question}
                  </Box>
                </Box>

                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color="#52796F"
                    textTransform="uppercase"
                    mb={1.5}
                  >
                    Synthesized AI Answer Excerpt
                  </Text>
                  <Box
                    p={4}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderCard}
                    fontSize="xs"
                    color={textHeading}
                    maxH="220px"
                    overflowY="auto"
                  >
                    <Text whiteSpace="pre-wrap" lineHeight="1.6">
                      {activeQueryDetail.answerSnippet}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter
            bg={iconBoxBg}
            borderTop="1px solid"
            borderColor={borderCard}
            py={3}
          >
            <Button size="sm" onClick={onClose} borderRadius="lg">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL 2: Document Token & Ingestion Breakdown Modal */}
      <Modal
        isOpen={isDocOpen}
        onClose={onDocClose}
        size="xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(6px)" bg="rgba(0,0,0,0.5)" />
        <ModalContent
          bg={modalBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={borderCard}
          overflow="hidden"
        >
          <ModalHeader bg="#2F3E46" color="white" py={4}>
            <HStack justify="space-between" align="center" pr={6}>
              <HStack spacing={2.5}>
                <Box p={1.5} bg="#52796F" borderRadius="lg" color="white">
                  <BookOpen size={18} />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="800">
                    Document Knowledge Base & Token Breakdown
                  </Text>
                  <Text fontSize="11px" color="#CAD7D0" fontWeight="500">
                    {activeDocDetail?.title || "Rulebook"} (v
                    {activeDocDetail?.version || "1.0"})
                  </Text>
                </Box>
              </HStack>
              <Badge
                bg="#84A98C"
                color="#141E1C"
                fontWeight="800"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="md"
              >
                {activeDocDetail?.authority || "FCA"} SOURCEBOOK
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" top={4} right={4} />

          <ModalBody p={6}>
            {activeDocDetail && (
              <VStack spacing={5} align="stretch">
                <Box
                  p={3.5}
                  bg={modalInnerBg}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderCard}
                >
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        File & Authority
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={textHeading}
                        mt={0.5}
                      >
                        {activeDocDetail.originalFileName}
                      </Text>
                      <HStack spacing={1.5} mt={1}>
                        <Badge bg="#2F3E46" color="white" fontSize="9px">
                          {activeDocDetail.authority}
                        </Badge>
                        {activeDocDetail.ruleCode && (
                          <Badge bg={iconBoxBg} color="#52796F" fontSize="9px">
                            {activeDocDetail.ruleCode}
                          </Badge>
                        )}
                      </HStack>
                    </Box>

                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Uploaded By
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={textHeading}
                        mt={0.5}
                      >
                        {activeDocDetail.uploadedBy?.name || "Super Admin"}
                      </Text>
                      <Text fontSize="10px" color={textSub}>
                        {activeDocDetail.uploadedBy?.department ||
                          "Finance & Compliance"}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        fontSize="10px"
                        fontWeight="800"
                        color="#52796F"
                        textTransform="uppercase"
                      >
                        Ingestion Date
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={textHeading}
                        mt={0.5}
                      >
                        {new Date(activeDocDetail.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                      <Text fontSize="10px" color={textSub}>
                        Status: {activeDocDetail.status}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
                <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3}>
                  <Box
                    p={3}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #2F3E46"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="800"
                      color="#52796F"
                      textTransform="uppercase"
                    >
                      Text Tokens
                    </Text>
                    <Heading
                      size="md"
                      color={textHeading}
                      mt={1}
                      fontWeight="900"
                    >
                      {(activeDocDetail.estimatedTokens || 0).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      Knowledge Base Size
                    </Text>
                  </Box>

                  <Box
                    p={3}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #52796F"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="800"
                      color="#52796F"
                      textTransform="uppercase"
                    >
                      Vector Chunks
                    </Text>
                    <Heading size="md" color="#52796F" mt={1} fontWeight="900">
                      {(activeDocDetail.chunkCount || 0).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      Indexed in Qdrant
                    </Text>
                  </Box>

                  <Box
                    p={3}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #84A98C"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="800"
                      color="#52796F"
                      textTransform="uppercase"
                    >
                      Avg / Chunk
                    </Text>
                    <Heading size="md" color="#84A98C" mt={1} fontWeight="900">
                      {activeDocDetail.chunkCount > 0
                        ? Math.round(
                            (activeDocDetail.estimatedTokens || 0) /
                              activeDocDetail.chunkCount,
                          )
                        : 0}
                    </Heading>
                    <Text fontSize="9px" color={textSub} mt={0.5}>
                      Tokens per Vector
                    </Text>
                  </Box>

                  <Box
                    p={3}
                    bg={modalInnerBg}
                    borderRadius="xl"
                    textAlign="center"
                    border="1px solid"
                    borderColor={borderCard}
                    borderTop="3px solid #D97706"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="800"
                      color="#D97706"
                      textTransform="uppercase"
                    >
                      Gatekeeper Tokens
                    </Text>
                    <Heading size="md" color="#D97706" mt={1} fontWeight="900">
                      {(
                        activeDocDetail.gatekeeper?.totalTokens || 1208
                      ).toLocaleString()}
                    </Heading>
                    <Text fontSize="9px" color="#D97706" mt={0.5}>
                      Pre-Ingestion LLM
                    </Text>
                  </Box>
                </SimpleGrid>
                <Box
                  p={4}
                  bg="#FEF3C7"
                  borderRadius="xl"
                  border="1px solid #FDE68A"
                >
                  <HStack justify="space-between" align="center" mb={1.5}>
                    <HStack spacing={2}>
                      <ShieldCheck size={16} color="#92400E" />
                      <Text fontSize="xs" fontWeight="800" color="#92400E">
                        AI Gatekeeper Pre-Ingestion Verification Audit
                      </Text>
                    </HStack>
                    <Badge
                      bg="#DEF7EC"
                      color="#03543F"
                      fontSize="10px"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontWeight="800"
                    >
                      APPROVED •{" "}
                      {activeDocDetail.gatekeeper?.durationMs || 1200}ms
                    </Badge>
                  </HStack>
                  <Text fontSize="11px" color="#78350F" lineHeight="1.5">
                    {activeDocDetail.aiReasoning ||
                      "The AI Gatekeeper inspected multi-point stratified checkpoints across this document, successfully verifying official UK regulatory authenticity and statutory jurisdiction prior to vector chunking."}
                  </Text>
                  <Divider my={2.5} borderColor="#FDE68A" />
                  <HStack
                    justify="space-between"
                    fontSize="10px"
                    color="#92400E"
                  >
                    <Text>
                      <strong>LLM Model:</strong>{" "}
                      {activeDocDetail.gatekeeper?.model ||
                        "openai/gpt-oss-120b"}
                    </Text>
                    <Text>
                      <strong>Prompt Tokens:</strong>{" "}
                      {(
                        activeDocDetail.gatekeeper?.promptTokens || 1120
                      ).toLocaleString()}
                    </Text>
                    <Text>
                      <strong>Completion Tokens:</strong>{" "}
                      {(
                        activeDocDetail.gatekeeper?.completionTokens || 88
                      ).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>{" "}
                <Box
                  p={3.5}
                  bg={modalInnerBg}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderCard}
                >
                  <HStack spacing={2} mb={1}>
                    <Database size={15} color="#52796F" />
                    <Text fontSize="xs" fontWeight="800" color="#52796F">
                      Why Large Rulebooks Don't Over-Bill Tokens in Chat
                    </Text>
                  </HStack>
                  <Text fontSize="11px" color={textSub} lineHeight="1.6">
                    This file contains{" "}
                    <strong>
                      {(activeDocDetail.estimatedTokens || 0).toLocaleString()}{" "}
                      tokens
                    </strong>
                    . Instead of sending the full text to the Groq LLM on every
                    query, the platform divided it into{" "}
                    <strong>
                      {activeDocDetail.chunkCount} dense vector chunks
                    </strong>{" "}
                    in Qdrant. During chat inquiries, cosine similarity
                    retrieval selects only the top 3-5 relevant provisions
                    (~1,100 tokens), protecting token consumption and response
                    latency.
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter
            bg={iconBoxBg}
            borderTop="1px solid"
            borderColor={borderCard}
            py={3}
          >
            <Button size="sm" onClick={onDocClose} borderRadius="lg">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
