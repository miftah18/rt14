import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface QRCodeData {
  id: number
  wargaId: number
  nominal: number
  tanggal: string
}

interface Warga {
  id: number
  nama: string
  no_hp: string
}

interface QRCodeTableProps {
  qrCodeData: QRCodeData[]
  warga: Warga[]
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

const QRCodeTable: React.FC<QRCodeTableProps> = ({ qrCodeData, warga }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Warga</TableHead>
          <TableHead>Nominal</TableHead>
          <TableHead>Tanggal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {qrCodeData.map((data) => {
          const wargaData = warga.find(w => w.id === data.wargaId)
          return (
            <TableRow key={data.id}>
              <TableCell>{wargaData ? wargaData.nama : 'Unknown'}</TableCell>
              <TableCell>{formatCurrency(data.nominal)}</TableCell>
              <TableCell>{new Date(data.tanggal).toLocaleDateString('id-ID')}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default QRCodeTable;