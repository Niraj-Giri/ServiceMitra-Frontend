export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => {
      const str = String(val ?? '').replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    }).join(',')
  );
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...rows].join('\n'));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
