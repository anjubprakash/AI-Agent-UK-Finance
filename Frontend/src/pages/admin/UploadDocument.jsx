import React, { useState, useRef, useMemo } from "react";
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
  useToast,
  Progress,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { regulatoryApi } from "../../api/regulatory.api.js";
import { AiGatekeeperModal } from "../../components/AiGatekeeperModal.jsx";
import { Upload, CheckCircle, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [authority, setAuthority] = useState("FCA");
  const [category, setCategory] = useState("Consumer Duty");
  const [ruleCode, setRuleCode] = useState("");
  const [version, setVersion] = useState("1.0");

  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  // Load existing indexed documents to check for duplicates in real-time
  const { data: existingDocsRes } = useQuery({
    queryKey: ["regulatoryDocs"],
    queryFn: () => regulatoryApi.getDocuments(),
  });
  const existingDocs = existingDocsRes?.data || [];

  const cardBg = useColorModeValue('white', '#141E1C');
  const cardBorder = useColorModeValue('#E5ECE8', '#263B36');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const subTextColor = useColorModeValue('#64748B', '#94A3B8');
  const inputBg = useColorModeValue('white', '#182724');
  const inputBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const dropzoneBg = useColorModeValue('#FAFCFB', '#0F1715');
  const dropzoneHoverBg = useColorModeValue('#F4F7F5', '#162320');
  const dropzoneActiveBg = useColorModeValue('#E5ECE8', '#1E322D');
  const iconCircleBg = useColorModeValue('white', '#182724');

  const [isDragging, setIsDragging] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [realStageSubtitle, setRealStageSubtitle] = useState("");
  const [gatekeeperResult, setGatekeeperResult] = useState(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pollingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  // Proactively detect if the current document/ruleCode matches an indexed document
  const duplicateMatch = useMemo(() => {
    if (!existingDocs || existingDocs.length === 0) return null;
    const curFileName = file?.name?.toLowerCase().trim();
    const curTitle = title?.toLowerCase().trim();
    const curRule = ruleCode?.toLowerCase().trim();

    return existingDocs.find((doc) => {
      if (doc.status !== "INDEXED") return false;
      const docFileName = (doc.originalFileName || "").toLowerCase().trim();
      const docTitle = (doc.title || "").toLowerCase().trim();
      const docRule = (doc.ruleCode || "").toLowerCase().trim();

      if (curFileName && docFileName && curFileName === docFileName) return true;
      if (curTitle && docTitle && curTitle === docTitle) return true;
      if (curRule && docRule && curRule === docRule) return true;
      return false;
    });
  }, [existingDocs, file, title, ruleCode]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const startProgressPolling = (uploadId) => {
    stopPolling();
    setProgress(0);
    setRealStageSubtitle("AI Gatekeeper inspecting UK regulatory authenticity...");

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await regulatoryApi.getUploadProgress(uploadId);
        const data = res?.data?.data || res?.data;
        if (data && typeof data.percent === "number") {
          setProgress((prev) => Math.max(prev, data.percent));
          if (data.message) {
            setRealStageSubtitle(data.message);
          }
          if (data.status === "COMPLETED" || data.percent >= 100) {
            stopPolling();
            setProgress(100);
          }
        }
      } catch (_) {
        // Silently tolerate temporary polling errors during transmission
      }
    }, 400);
  };

  const handleResetForm = () => {
    setFile(null);
    setTitle("");
    setRuleCode("");
    setVersion("1.0");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectedFile = (selected) => {
    if (!selected) return;

    const validExtensions = [".pdf", ".docx", ".doc"];
    const ext = selected.name.substring(selected.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an official regulatory PDF or Word (.docx, .doc) document.",
        status: "warning",
        duration: 4000,
      });
      return;
    }

    setFile(selected);

    // Automatically set a clean, human-readable title based on the selected file
    const cleanTitle = selected.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    setTitle(cleanTitle);

    // Auto-detect authority from filename if present
    const upperName = selected.name.toUpperCase();
    if (upperName.includes("PRA")) {
      setAuthority("PRA");
    } else if (upperName.includes("BOE") || upperName.includes("BANK OF ENGLAND")) {
      setAuthority("BOE");
    } else {
      setAuthority("FCA");
    }

    // Auto-detect rule code if matching standard FCA codes
    const codeMatch = selected.name.match(/\b(PRIN|FIT|SYSC|COBS|DISP|CONC|MCOB|CASS|SUP|GEN)\b/i);
    if (codeMatch) {
      setRuleCode(codeMatch[0].toUpperCase());
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      handleSelectedFile(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (formData) => regulatoryApi.uploadDocument(formData),
    onSuccess: (res) => {
      stopPolling();
      setProgress(100);
      setRealStageSubtitle("Successfully indexed all semantic chunks into Qdrant!");
      queryClient.invalidateQueries({ queryKey: ["regulatoryDocs"] });
      setGatekeeperResult(res.data);
      setIsError(false);
      setModalOpen(true);
      toast({
        title: "Document Verified & Ingested",
        description: `'${res.data?.title || "Rulebook"}' indexed into the knowledge base (${res.data?.chunkCount || 0} chunks).`,
        status: "success",
        duration: 4000,
      });
    },
    onError: (err) => {
      stopPolling();
      setProgress(0);
      setRealStageSubtitle("");
      setIsError(true);
      setErrorMessage(err.message);
      setModalOpen(true);
      // Redundant toast removed: AiGatekeeperModal provides full, clean rejection details
    },
  });

  const handleModalClose = () => {
    setModalOpen(false);
    stopPolling();
    setProgress(0);
    setRealStageSubtitle("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Please select a document file to upload",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const uploadId = "upl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("authority", authority);
    formData.append("category", category);
    formData.append("ruleCode", ruleCode);
    formData.append("version", version);
    formData.append("uploadId", uploadId);

    // Open modal immediately and start real-time progress polling
    setIsError(false);
    setErrorMessage("");
    setGatekeeperResult(null);
    startProgressPolling(uploadId);
    setModalOpen(true);

    uploadMutation.mutate(formData);
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color={headingColor} fontWeight="800">
            Upload UK Financial Regulatory Document
          </Heading>
          <Text fontSize="sm" color={subTextColor} mt={1}>
            Upload official rulebooks published by the FCA, PRA, or Bank of
            England. The document is strictly verified by the AI Gatekeeper before
            indexing into the compliance knowledge base.
          </Text>
        </Box>

        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
          <CardBody p={{ base: 6, md: 8 }}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                {/* File Dropzone with Full Drag & Drop Support */}
                <Box
                  p={8}
                  border="2px dashed"
                  borderColor={isDragging ? "#52796F" : file ? "#52796F" : inputBorder}
                  borderRadius="2xl"
                  bg={isDragging ? dropzoneActiveBg : file ? dropzoneHoverBg : dropzoneBg}
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  _hover={{ borderColor: "#52796F", bg: dropzoneHoverBg }}
                  transition="all 0.2s"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc"
                    style={{ display: "none" }}
                  />
                  <VStack spacing={2}>
                    <Box
                      p={3}
                      bg={iconCircleBg}
                      borderRadius="full"
                      boxShadow="sm"
                      color="#52796F"
                    >
                      {file ? <CheckCircle size={32} /> : <Upload size={32} />}
                    </Box>
                    {file ? (
                      <Box>
                        <Text fontWeight="700" color={headingColor}>
                          {file.name}
                        </Text>
                        <Text fontSize="xs" color="#52796F" fontWeight="600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for
                          AI Gatekeeper verification
                        </Text>
                      </Box>
                    ) : (
                      <Box>
                        <Text fontWeight="700" color={headingColor}>
                          {isDragging ? "Drop file to upload" : "Click to upload or drag and drop"}
                        </Text>
                        <Text fontSize="xs" color={subTextColor}>
                          Official PDF or Word Documents (.pdf, .docx) up to 50 MB
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Proactive Duplicate Alert if File/Rule is Already Indexed */}
                {duplicateMatch && (
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg={useColorModeValue("orange.50", "rgba(249, 115, 22, 0.12)")}
                    border="1px solid"
                    borderColor={useColorModeValue("orange.200", "rgba(249, 115, 22, 0.35)")}
                  >
                    <HStack spacing={3} align="flex-start">
                      <Box p={1.5} borderRadius="md" bg={useColorModeValue("orange.100", "rgba(249, 115, 22, 0.2)")}>
                        <AlertTriangle size={18} color="#DD6B20" />
                      </Box>
                      <VStack align="start" spacing={1.5} flex="1">
                        <HStack justify="space-between" w="full">
                          <Text fontSize="xs" fontWeight="800" color={useColorModeValue("orange.800", "orange.200")}>
                            Rulebook Already in Compliance Knowledge Base
                          </Text>
                          <Badge colorScheme="orange" fontSize="10px">
                            ALREADY INDEXED
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color={useColorModeValue("orange.800", "orange.100")} lineHeight="tall">
                          An official regulatory document matching <strong>"{duplicateMatch.title}"</strong> (Code: <strong>{duplicateMatch.ruleCode || "N/A"}</strong>, Version {duplicateMatch.version}) is already indexed with {duplicateMatch.chunkCount} semantic clauses.
                        </Text>
                        <HStack spacing={2} pt={1}>
                          <Button
                            size="xs"
                            colorScheme="orange"
                            variant="outline"
                            rightIcon={<ArrowRight size={12} />}
                            onClick={() => navigate("/admin/rules")}
                          >
                            Update Version in Rules Library
                          </Button>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                )}

                {/* Form Fields */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>
                    Document Title
                  </FormLabel>
                  <Input
                    placeholder="e.g. FCA Consumer Duty Principle (PRIN 2A)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    color={headingColor}
                    _focus={{ borderColor: "#52796F", boxShadow: "0 0 0 1px #52796F" }}
                    borderRadius="xl"
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>
                      Regulatory Authority
                    </FormLabel>
                    <Select
                      value={authority}
                      onChange={(e) => setAuthority(e.target.value)}
                      bg={inputBg}
                      borderColor={inputBorder}
                      color={headingColor}
                      _focus={{ borderColor: "#52796F", boxShadow: "0 0 0 1px #52796F" }}
                      borderRadius="xl"
                    >
                      <option value="FCA" style={{ backgroundColor: cardBg }}>
                        FCA (Financial Conduct Authority)
                      </option>
                      <option value="PRA" style={{ backgroundColor: cardBg }}>
                        PRA (Prudential Regulation Authority)
                      </option>
                      <option value="BOE" style={{ backgroundColor: cardBg }}>Bank of England</option>
                      <option value="OTHER" style={{ backgroundColor: cardBg }}>Other UK Statute</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>
                      Version
                    </FormLabel>
                    <Input
                      placeholder="1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      bg={inputBg}
                      borderColor={inputBorder}
                      color={headingColor}
                      _focus={{ borderColor: "#52796F", boxShadow: "0 0 0 1px #52796F" }}
                      borderRadius="xl"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>
                      Regulatory Category
                    </FormLabel>
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      bg={inputBg}
                      borderColor={inputBorder}
                      color={headingColor}
                      _focus={{ borderColor: "#52796F", boxShadow: "0 0 0 1px #52796F" }}
                      borderRadius="xl"
                    >
                      <option value="Consumer Duty" style={{ backgroundColor: cardBg }}>
                        Consumer Duty (PRIN 2A)
                      </option>
                      <option value="Senior Management (SYSC)" style={{ backgroundColor: cardBg }}>
                        Senior Management & Governance (SYSC)
                      </option>
                      <option value="Conduct of Business (COBS)" style={{ backgroundColor: cardBg }}>
                        Conduct of Business (COBS)
                      </option>
                      <option value="Anti-Money Laundering (AML)" style={{ backgroundColor: cardBg }}>
                        AML & Sanctions
                      </option>
                      <option value="Capital & Liquidity" style={{ backgroundColor: cardBg }}>
                        Capital & Liquidity Requirements
                      </option>
                      <option value="General Regulation" style={{ backgroundColor: cardBg }}>
                        General Financial Regulation
                      </option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>
                      Rule Code (Optional)
                    </FormLabel>
                    <Input
                      placeholder="e.g. PRIN 2A, SYSC 4.1"
                      value={ruleCode}
                      onChange={(e) => setRuleCode(e.target.value)}
                      bg={inputBg}
                      borderColor={inputBorder}
                      color={headingColor}
                      _focus={{ borderColor: "#52796F", boxShadow: "0 0 0 1px #52796F" }}
                      borderRadius="xl"
                    />
                  </FormControl>
                </HStack>

                <Button
                  type="submit"
                  bg="#52796F"
                  color="white"
                  _hover={{ bg: "#416159" }}
                  size="lg"
                  mt={2}
                  isLoading={uploadMutation.isPending}
                  loadingText="Processing & Verifying..."
                  borderRadius="xl"
                  fontWeight="700"
                  boxShadow="0 4px 12px -2px rgba(82, 121, 111, 0.35)"
                >
                  Verify with AI Gatekeeper & Ingest Rulebook
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>

      {/* AI Gatekeeper Inspection & Progress Modal */}
      <AiGatekeeperModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        isProcessing={uploadMutation.isPending}
        progress={Math.round(progress)}
        currentFileName={file?.name || title}
        currentAuthority={authority}
        customStageSubtitle={realStageSubtitle}
        result={gatekeeperResult}
        isError={isError}
        errorMessage={errorMessage}
        onResetForm={handleResetForm}
      />
    </Container>
  );
};
