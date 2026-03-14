import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Case, type Document, type User, type PracticeArea } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Users, Clock, Briefcase, Edit2, Check, X,
  Download, Eye, Upload, History, Pencil, Trash2, FileImage,
  File, Plus, ChevronRight,
  Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Undo2, Redo2, Heading1, Heading2, Pilcrow, Strikethrough,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineTipTap from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(t))
    return <FileImage className="h-5 w-5" />;
  if (t === "pdf") return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function getFileIconBg(type: string) {
  const t = type.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(t)) return "bg-green-500/10 text-green-500";
  if (t === "pdf") return "bg-red-500/10 text-red-500";
  if (["doc", "docx"].includes(t)) return "bg-blue-500/10 text-blue-500";
  if (["xls", "xlsx", "csv"].includes(t)) return "bg-emerald-500/10 text-emerald-500";
  return "bg-muted text-muted-foreground";
}

function isPreviewable(type: string) {
  const t = type.toLowerCase();
  return t === "pdf" || isImage(t) || isWordDoc(t);
}

function isImage(type: string) {
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type.toLowerCase());
}

function isWordDoc(type: string) {
  return ["doc", "docx"].includes(type.toLowerCase());
}

function downloadUrl(docId: string, inline = false) {
  const token = getToken();
  return `/api/documents/${docId}/download?token=${token}${inline ? "&inline=true" : ""}`;
}

// ─── DOCX In-Browser Editor ──────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, title, children, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-7 w-7 ${active ? "toggle-elevate toggle-elevated" : "toggle-elevate"}`}
    >
      {children}
    </Button>
  );
}

function DocxEditor({
  doc,
  caseId,
  onNewVersion,
}: {
  doc: Document;
  caseId: string;
  onNewVersion: () => void;
}) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  const { data: htmlData, isLoading, isError } = useQuery<{ html: string }>({
    queryKey: ["/api/documents", doc.id, "html-content"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/documents/${doc.id}/html-content?token=${token}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load content");
      return res.json();
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineTipTap,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editable: false,
  });

  useEffect(() => {
    if (editor && htmlData?.html) {
      editor.commands.setContent(htmlData.html);
    }
  }, [htmlData?.html, editor]);

  useEffect(() => {
    editor?.setEditable(isEditing);
  }, [isEditing, editor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      const html = editor?.getHTML() ?? "";
      const res = await fetch(`/api/documents/${doc.id}/save-edit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ html, changeNote }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}/documents`] });
      toast({ title: "New version saved" });
      setIsEditing(false);
      setChangeNote("");
      setShowSaveDialog(false);
      onNewVersion();
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const cancelEdit = () => {
    setIsEditing(false);
    if (htmlData?.html) editor?.commands.setContent(htmlData.html);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-muted/20 flex-wrap shrink-0">
        <ToolbarBtn title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} disabled={!isEditing}>
          <BoldIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} disabled={!isEditing}>
          <ItalicIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} disabled={!isEditing}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} disabled={!isEditing}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        <ToolbarBtn title="Heading 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} disabled={!isEditing}>
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} disabled={!isEditing}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Paragraph" onClick={() => editor?.chain().focus().setParagraph().run()} active={editor?.isActive("paragraph")} disabled={!isEditing}>
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        <ToolbarBtn title="Align left" onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} disabled={!isEditing}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Align center" onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} disabled={!isEditing}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Align right" onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} disabled={!isEditing}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        <ToolbarBtn title="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} disabled={!isEditing}>
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} disabled={!isEditing}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        <ToolbarBtn title="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!isEditing || !editor?.can().undo()}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!isEditing || !editor?.can().redo()}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="flex-1" />

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
            <Button size="sm" onClick={() => setShowSaveDialog(true)}>
              <Check className="h-4 w-4 mr-1.5" /> Save as New Version
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} disabled={isLoading || isError}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
        )}
      </div>

      {/* Document content area */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading document content...</p>
        </div>
      )}
      {isError && (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-destructive text-sm">Could not render document content.</p>
          <a href={downloadUrl(doc.id)} download={doc.name}>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Download Original</Button>
          </a>
        </div>
      )}
      {!isLoading && !isError && (
        <div className="flex-1 overflow-auto p-8">
          <div className={`prose dark:prose-invert max-w-3xl mx-auto min-h-[60vh] ${isEditing ? "outline outline-2 outline-primary/30 rounded-md p-4" : ""}`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* Save as new version dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Change note (optional)</Label>
            <Textarea
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="resize-none mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Document Viewer Dialog ──────────────────────────────────────────────────

function DocumentViewerDialog({
  doc,
  open,
  onClose,
  caseId,
}: {
  doc: Document | null;
  open: boolean;
  onClose: () => void;
  caseId: string;
}) {
  if (!doc) return null;
  const img = isImage(doc.type);
  const word = isWordDoc(doc.type);
  const isPdf = doc.type.toLowerCase() === "pdf";

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className={`${word ? "max-w-5xl" : "max-w-4xl"} w-full h-[90vh] flex flex-col p-0 gap-0`}>
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`p-2 rounded-md shrink-0 ${getFileIconBg(doc.type)}`}>
              {getFileIcon(doc.type)}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base truncate">{doc.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {doc.size} · Version {doc.version} · {new Date(doc.createdAt).toLocaleDateString()}
                {word && <span className="ml-2 text-primary font-medium">Word Document</span>}
              </p>
            </div>
          </div>
          <a href={downloadUrl(doc.id)} download={doc.name} className="shrink-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </a>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {word ? (
            <DocxEditor key={doc.id} doc={doc} caseId={caseId} onNewVersion={onClose} />
          ) : img ? (
            <div className="h-full flex items-center justify-center p-6 bg-muted/20">
              <img
                src={downloadUrl(doc.id, true)}
                alt={doc.name}
                className="max-h-full max-w-full object-contain rounded-md"
              />
            </div>
          ) : isPdf ? (
            <object
              data={downloadUrl(doc.id, true)}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <span className={`p-6 rounded-full ${getFileIconBg(doc.type)}`}>
                  {getFileIcon(doc.type)}
                </span>
                <p className="text-sm">Your browser cannot display this PDF inline.</p>
                <a href={downloadUrl(doc.id)} download={doc.name}>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                </a>
              </div>
            </object>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <span className={`p-6 rounded-full ${getFileIconBg(doc.type)}`}>
                {getFileIcon(doc.type)}
              </span>
              <p className="text-sm">Preview not available for {doc.type.toUpperCase()} files.</p>
              <a href={downloadUrl(doc.id)} download={doc.name}>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Download to view
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Version History Dialog ──────────────────────────────────────────────────

function VersionHistoryDialog({
  doc,
  open,
  onClose,
  onView,
  users,
}: {
  doc: Document | null;
  open: boolean;
  onClose: () => void;
  onView: (d: Document) => void;
  users: User[];
}) {
  const rootId = doc ? (doc.parentDocumentId || doc.id) : null;

  const { data: versions = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", rootId, "versions"],
    enabled: open && !!rootId,
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/documents/${rootId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load versions");
      return res.json();
    },
  });

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{doc.name}</p>
        </DialogHeader>

        <div className="space-y-1 max-h-96 overflow-y-auto py-2">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">Loading versions...</p>
          )}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No versions found.</p>
          )}
          {[...versions].reverse().map((v, idx) => {
            const uploader = users.find(u => u.id === v.uploadedById);
            const isLatest = idx === 0;
            return (
              <div
                key={v.id}
                className="flex items-start gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                onClick={() => { onView(v); onClose(); }}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    v{v.version}
                  </div>
                  {idx < versions.length - 1 && <div className="w-px flex-1 bg-border min-h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Version {v.version}</span>
                    {isLatest && <Badge variant="default" className="text-[10px]">Latest</Badge>}
                  </div>
                  {v.changeNote && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{v.changeNote}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {uploader?.name ?? "Unknown"} · {new Date(v.createdAt).toLocaleString()}
                  </p>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upload Dialog (new file or new version) ─────────────────────────────────

function UploadDialog({
  open,
  onClose,
  caseId,
  parentDoc,
}: {
  open: boolean;
  onClose: () => void;
  caseId: string;
  parentDoc: Document | null; // null = new file, set = new version
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [changeNote, setChangeNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isNewVersion = !!parentDoc;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const token = getToken();
      const form = new FormData();
      form.append("file", selectedFile);
      if (isNewVersion) {
        form.append("changeNote", changeNote);
        const res = await fetch(`/api/documents/${parentDoc!.parentDocumentId || parentDoc!.id}/new-version`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      } else {
        form.append("caseId", caseId);
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}/documents`] });
      toast({ title: isNewVersion ? "New version uploaded" : "File uploaded successfully" });
      setSelectedFile(null);
      setChangeNote("");
      onClose();
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { setSelectedFile(null); setChangeNote(""); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isNewVersion ? `Upload New Version — ${parentDoc?.name}` : "Upload Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover-elevate"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {selectedFile ? (
              <p className="text-sm font-medium">{selectedFile.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Click to select a file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images up to 50MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {isNewVersion && (
            <div className="space-y-2">
              <Label>Change note (optional)</Label>
              <Textarea
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
                placeholder="Describe what changed in this version..."
                className="resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!selectedFile || mutation.isPending}
          >
            {mutation.isPending ? "Uploading..." : isNewVersion ? "Upload Version" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rename Dialog ────────────────────────────────────────────────────────────

function RenameDialog({
  doc,
  open,
  onClose,
  caseId,
}: {
  doc: Document | null;
  open: boolean;
  onClose: () => void;
  caseId: string;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");

  useEffect(() => { if (doc) setName(doc.name); }, [doc]);

  const mutation = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/documents/${doc!.id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}/documents`] });
      toast({ title: "Document renamed" });
      onClose();
    },
    onError: () => toast({ title: "Rename failed", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label>Document name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-2"
            onKeyDown={e => e.key === "Enter" && mutation.mutate()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ caseId, currentUser }: { caseId: string; currentUser?: User }) {
  const { data: rawDocs = [] } = useQuery<Document[]>({
    queryKey: [`/api/cases/${caseId}/documents`],
  });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { toast } = useToast();

  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newVersionDoc, setNewVersionDoc] = useState<Document | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);

  // Group: root docs + find latest version for display
  const rootDocs = rawDocs.filter(d => !d.parentDocumentId);
  const versionedDocs = rawDocs.filter(d => !!d.parentDocumentId);

  const getLatest = (root: Document): Document => {
    const versions = versionedDocs.filter(v => v.parentDocumentId === root.id);
    if (versions.length === 0) return root;
    return versions.reduce((a, b) => Number(a.version) > Number(b.version) ? a : b);
  };

  const getVersionCount = (root: Document): number =>
    1 + versionedDocs.filter(v => v.parentDocumentId === root.id).length;

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => apiRequest("DELETE", `/api/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}/documents`] });
      toast({ title: "Document deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rootDocs.length} document{rootDocs.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setUploadOpen(true)} data-testid="button-upload-document">
          <Plus className="h-4 w-4 mr-2" /> Upload File
        </Button>
      </div>

      {rootDocs.length === 0 ? (
        <div
          className="border-2 border-dashed rounded-md p-10 text-center cursor-pointer hover-elevate"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click to upload the first file</p>
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {rootDocs.map(root => {
            const latest = getLatest(root);
            const versionCount = getVersionCount(root);
            const uploader = users.find(u => u.id === latest.uploadedById);

            return (
              <div
                key={root.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                data-testid={`row-document-${root.id}`}
              >
                <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${getFileIconBg(latest.type)}`}>
                  {getFileIcon(latest.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <button
                    className="font-medium text-sm text-left hover:underline truncate max-w-full"
                    onClick={() => setViewingDoc(latest)}
                  >
                    {latest.name}
                  </button>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{latest.size}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {uploader?.name ?? "Unknown"} · {new Date(latest.createdAt).toLocaleDateString()}
                    </span>
                    {versionCount > 1 && (
                      <>
                        <span className="text-muted-foreground text-xs">·</span>
                        <button
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => setHistoryDoc(root)}
                        >
                          <History className="h-3 w-3" />
                          {versionCount} versions
                        </button>
                      </>
                    )}
                  </div>
                  {latest.changeNote && (
                    <p className="text-xs text-muted-foreground italic mt-0.5 truncate">{latest.changeNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View"
                    onClick={() => setViewingDoc(latest)}
                    data-testid={`button-view-doc-${root.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <a href={downloadUrl(latest.id)} download={latest.name}>
                    <Button variant="ghost" size="icon" title="Download" data-testid={`button-download-doc-${root.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-doc-menu-${root.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setNewVersionDoc(latest)}>
                        <Upload className="h-4 w-4 mr-2" /> Upload new version
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setHistoryDoc(root)}>
                        <History className="h-4 w-4 mr-2" /> Version history
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRenameDoc(latest)}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(root.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DocumentViewerDialog doc={viewingDoc} open={!!viewingDoc} onClose={() => setViewingDoc(null)} caseId={caseId} />
      <VersionHistoryDialog doc={historyDoc} open={!!historyDoc} onClose={() => setHistoryDoc(null)} onView={setViewingDoc} users={users} />
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} caseId={caseId} parentDoc={null} />
      <UploadDialog open={!!newVersionDoc} onClose={() => setNewVersionDoc(null)} caseId={caseId} parentDoc={newVersionDoc} />
      <RenameDialog doc={renameDoc} open={!!renameDoc} onClose={() => setRenameDoc(null)} caseId={caseId} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const { toast } = useToast();

  const queryParams = new URLSearchParams(location.split("?")[1]);
  const initialEditMode = queryParams.get("edit") === "true";
  const initialTab = queryParams.get("tab") || "documents";

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: caseItem, isLoading: isLoadingCase } = useQuery<Case>({
    queryKey: [`/api/cases/${id}`],
  });
  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({ queryKey: ["/api/practice-areas"] });
  const { data: assignedUsers = [] } = useQuery<User[]>({ queryKey: [`/api/cases/${id}/users`] });
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    if (caseItem) {
      setEditTitle(caseItem.title);
      setEditDescription(caseItem.description || "");
      setEditStatus(caseItem.status);
    }
  }, [caseItem]);

  const updateCaseMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("PATCH", `/api/cases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${id}`] });
      setIsEditing(false);
      toast({ title: "Case updated successfully" });
    },
  });

  if (isLoadingCase) return <div className="p-8 text-center text-muted-foreground">Loading case details...</div>;
  if (!caseItem) return <div className="p-8 text-center text-destructive">Case not found</div>;

  const handleSave = () => updateCaseMutation.mutate({ title: editTitle, description: editDescription, status: editStatus });

  const getPracticeAreaDisplay = () => {
    if (caseItem.customPracticeAreaId) {
      const pa = practiceAreas.find(p => p.id === caseItem.customPracticeAreaId);
      if (pa) return pa.name;
    }
    return caseItem.practiceArea.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const statusColors: Record<string, string> = {
    active: "bg-status-online/10 text-status-online border-status-online/20",
    pending: "bg-status-away/10 text-status-away border-status-away/20",
    closed: "bg-muted text-muted-foreground border-muted",
    under_review: "bg-status-busy/10 text-status-busy border-status-busy/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground uppercase tracking-wider">{caseItem.caseNumber}</span>
            {!isEditing && (
              <Badge variant="outline" className={statusColors[caseItem.status]}>
                {caseItem.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4 max-w-2xl mt-4">
              <div className="space-y-2">
                <Label>Case Title</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateCaseMutation.isPending}>
                  <Check className="h-4 w-4 mr-2" /> Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{caseItem.title}</h1>
                <p className="text-muted-foreground mt-1">{getPracticeAreaDisplay()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit Case
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Case Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                  placeholder="Enter case description..."
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {caseItem.description || "No description provided."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Team ({assignedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="pt-4">
              <Card>
                <CardContent className="pt-4">
                  <DocumentsTab caseId={id!} currentUser={currentUser} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="pt-4">
              <Card>
                <CardContent className="p-4">
                  {assignedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No team members assigned yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {assignedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-3 border rounded-md">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 pb-4 border-l border-muted">
                <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Last Updated</p>
                <p className="text-sm mt-1">Status: {caseItem.status.replace("_", " ")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(caseItem.updatedAt).toLocaleString()}</p>
              </div>
              <div className="relative pl-6 border-l border-muted">
                <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Case Created</p>
                <p className="text-sm mt-1">Filed in the system</p>
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(caseItem.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
