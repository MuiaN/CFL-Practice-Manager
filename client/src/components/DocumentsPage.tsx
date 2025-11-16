import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  MoreVertical,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  type: string;
  caseNumber: string;
  version: number;
  updatedBy: string;
  updatedAt: string;
  size: string;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockDocuments: Document[] = [
    {
      id: "1",
      name: "Merger Agreement Draft v3.pdf",
      type: "PDF",
      caseNumber: "CFL-2024-0042",
      version: 3,
      updatedBy: "Sarah Kimani",
      updatedAt: "2 hours ago",
      size: "2.4 MB",
    },
    {
      id: "2",
      name: "Trademark Application Form.docx",
      type: "DOCX",
      caseNumber: "CFL-2024-0038",
      version: 1,
      updatedBy: "Mary Wanjiru",
      updatedAt: "1 day ago",
      size: "156 KB",
    },
    {
      id: "3",
      name: "Property Lease Agreement.pdf",
      type: "PDF",
      caseNumber: "CFL-2024-0035",
      version: 2,
      updatedBy: "John Mwangi",
      updatedAt: "3 days ago",
      size: "1.8 MB",
    },
    {
      id: "4",
      name: "Loan Contract Analysis.xlsx",
      type: "XLSX",
      caseNumber: "CFL-2024-0029",
      version: 1,
      updatedBy: "Robert Kariuki",
      updatedAt: "5 days ago",
      size: "324 KB",
    },
  ];

  const folders = [
    { name: "Contracts", count: 24 },
    { name: "Litigation", count: 18 },
    { name: "Compliance", count: 12 },
    { name: "Templates", count: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage case documents and files
          </p>
        </div>
        <Button data-testid="button-upload">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-documents"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {folders.map((folder, index) => (
          <Card
            key={index}
            className="hover-elevate cursor-pointer"
            data-testid={`folder-${index}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Folder className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {folder.count} files
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>
        <div className="space-y-2">
          {mockDocuments.map((doc) => (
            <Card key={doc.id} className="hover-elevate" data-testid={`document-${doc.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-mono">{doc.caseNumber}</span>
                      <span>•</span>
                      <span>v{doc.version}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="secondary" data-testid={`badge-type-${doc.id}`}>
                      {doc.type}
                    </Badge>
                    <div className="text-sm text-muted-foreground text-right">
                      <p>{doc.updatedBy}</p>
                      <p className="text-xs">{doc.updatedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-${doc.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-download-${doc.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-menu-${doc.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
