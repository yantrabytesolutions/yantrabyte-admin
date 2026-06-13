/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * @param data Array of objects to export
 * @param filename Name of the file to save (without .csv extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    return;
  }

  // Extract all unique keys from the objects to form headers
  const headers = Array.from(new Set(data.flatMap(Object.keys)));
  
  // Format the CSV string
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        // Escape quotes and wrap in quotes if there are commas or quotes
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Fallback for older browsers
  if ((navigator as any).msSaveBlob) {
    (navigator as any).msSaveBlob(blob, `${filename}.csv`);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
