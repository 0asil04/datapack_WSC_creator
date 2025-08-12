import React, { useState, useMemo, useEffect } from 'react';
import { CsvRow } from '../types';
import { LEGENDS, CONTINENTS } from '../constants';
import JSZip from 'jszip';
import { ActionButton } from './ActionButton';

interface CsvEditorProps {
    filePath: string;
    content: string;
    onContentChange: (newContent: string) => void;
    zipInstance: JSZip | null;
}

const parseCsv = (text: string): CsvRow[] => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) {
            return { id: line.trim(), values: '' };
        }
        return {
            id: line.substring(0, firstCommaIndex).trim(),
            values: line.substring(firstCommaIndex + 1)
        };
    }).filter(row => row.id !== '');
};

const stringifyCsv = (rows: CsvRow[]): string => {
    return rows.map(row => `${row.id},${row.values}`).join('\n');
};

const AddLegendModal: React.FC<{
    legends: {id: string; name: string}[];
    existingIds: Set<string>;
    onAdd: (legend: {id: string; name: string}) => void;
    onClose: () => void;
}> = ({ legends, existingIds, onAdd, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredLegends = legends.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
                <h3 className="text-lg font-bold p-4 border-b border-gray-700">Adicionar Lenda</h3>
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Pesquisar lenda..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                        autoFocus
                    />
                </div>
                <div className="flex-grow overflow-y-auto px-4">
                    {filteredLegends.map(legend => (
                        <div key={legend.id} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded">
                            <span>{legend.name} ({legend.id})</span>
                            <button
                                onClick={() => onAdd(legend)}
                                disabled={existingIds.has(legend.id)}
                                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded"
                            >
                                {existingIds.has(legend.id) ? 'Adicionado' : 'Adicionar'}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-700 text-right">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded">Fechar</button>
                </div>
            </div>
        </div>
    );
}

const ROWS_PER_PAGE = 50;

export const CsvEditor: React.FC<CsvEditorProps> = ({ filePath, content, onContentChange, zipInstance }) => {
    const [rows, setRows] = useState<CsvRow[]>(() => parseCsv(content));
    const [searchTerm, setSearchTerm] = useState('');
    const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
    
    const [continentFilter, setContinentFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    
    // Data for filters
    const [teamsMap, setTeamsMap] = useState<Record<string, string>>({});
    const [countryContinentMap, setCountryContinentMap] = useState<Record<string, string>>({});

    const [currentPage, setCurrentPage] = useState(1);

    // Effect to re-parse rows only when the file path changes
    useEffect(() => {
        setRows(parseCsv(content));
        setCurrentPage(1); // Reset page on file change
    }, [filePath, content]);

    // Effect to fetch auxiliary data for filters
    useEffect(() => {
        const fetchFilterData = async () => {
            if (!zipInstance) return;

            // For players.csv team filter
            if (filePath.includes('players.csv')) {
                const teamsFile = zipInstance.file('teams.csv') || zipInstance.file('clubs.csv');
                if (teamsFile) {
                    try {
                        const teamsContent = await teamsFile.async('string');
                        const parsedTeams = parseCsv(teamsContent);
                        setTeamsMap(parsedTeams.reduce((acc, team) => {
                            acc[team.id] = team.values.split(',')[0]?.trim() || '';
                            return acc;
                        }, {} as Record<string, string>));
                    } catch (e) { console.error("Could not read teams/clubs file", e); }
                }
            }

            // For clubs.csv continent filter
            if (filePath.includes('clubs.csv')) {
                const countriesFile = zipInstance.file('countries.csv');
                if (countriesFile) {
                    try {
                        const countriesContent = await countriesFile.async('string');
                        const parsedCountries = parseCsv(countriesContent);
                        setCountryContinentMap(parsedCountries.reduce((acc, country) => {
                            acc[country.id] = country.values.split(',')[0]?.trim() || '';
                            return acc;
                        }, {} as Record<string, string>));
                    } catch(e) { console.error("Could not read countries.csv", e); }
                }
            }
        };
        fetchFilterData();
    }, [filePath, zipInstance]);
    
    const handleRowChange = (indexInAllRows: number, newValues: string) => {
        const updatedRows = [...rows];
        updatedRows[indexInAllRows] = { ...updatedRows[indexInAllRows], values: newValues };
        setRows(updatedRows);
        onContentChange(stringifyCsv(updatedRows));
    };

    const handleAddLegend = (legend: {id: string; name: string}) => {
        const newName = prompt(`Renomear "${legend.name}"? (Deixe em branco para manter o nome)`, legend.name);
        // Default format: Name,NationalityID,TeamID,BirthYear,Position,Foot,Skills...
        const newLegendRow: CsvRow = { id: legend.id, values: `${newName || legend.name},76,0,1980,ST,R,99,99,99,99,99,99,99` };
        const updatedRows = [...rows, newLegendRow];
        setRows(updatedRows);
        onContentChange(stringifyCsv(updatedRows));
    };

    const filteredRows = useMemo(() => {
        let filtered = rows;

        if (searchTerm) {
            filtered = filtered.filter(row => `${row.id} ${row.values}`.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (continentFilter) {
            if (filePath.includes('competitions.csv')) {
                filtered = filtered.filter(row => (row.values.split(',')[1]?.trim() === continentFilter));
            } else if (filePath.includes('clubs.csv') && Object.keys(countryContinentMap).length > 0) {
                 filtered = filtered.filter(row => {
                    const countryId = row.values.split(',')[1]?.trim();
                    return countryId ? countryContinentMap[countryId] === continentFilter : false;
                 });
            }
        }
        
        if (teamFilter && filePath.includes('players.csv')) {
            filtered = filtered.filter(row => {
                const teamId = row.values.split(',')[2]?.trim();
                const teamName = teamId ? teamsMap[teamId] || '' : '';
                return teamName.toLowerCase().includes(teamFilter.toLowerCase());
            });
        }
        
        return filtered;
    }, [rows, searchTerm, continentFilter, teamFilter, filePath, teamsMap, countryContinentMap]);
    
    // Pagination logic
    const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
    const paginatedRows = filteredRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    const existingLegendIds = useMemo(() => new Set(rows.map(r => r.id)), [rows]);

    return (
        <div className="flex flex-col h-full bg-transparent rounded-lg overflow-hidden">
             {isLegendModalOpen && (
                <AddLegendModal
                    legends={LEGENDS}
                    existingIds={existingLegendIds}
                    onAdd={handleAddLegend}
                    onClose={() => setIsLegendModalOpen(false)}
                />
            )}
            <div className="p-2 border-b border-gray-700 flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    placeholder="Procurar na tabela..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="flex-grow bg-gray-800 border border-gray-600 rounded p-1.5"
                />
                 {filePath.includes('players.csv') && (
                    <ActionButton onClick={() => setIsLegendModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold !py-1.5 !px-3">Adicionar Lendas</ActionButton>
                 )}
            </div>

            {(filePath.includes('competitions.csv') || filePath.includes('clubs.csv')) && (
                <div className="p-2 border-b border-gray-700">
                    <span className="mr-2 font-semibold text-sm">Filtar por Continente:</span>
                    <select value={continentFilter} onChange={e => { setContinentFilter(e.target.value); setCurrentPage(1); }} className="bg-gray-800 rounded p-1 text-sm">
                        <option value="">Todos</option>
                        {Object.entries(CONTINENTS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                </div>
            )}
             {filePath.includes('players.csv') && (
                <div className="p-2 border-b border-gray-700">
                     <input
                        type="text"
                        placeholder="Filtrar por nome do time..."
                        value={teamFilter}
                        onChange={e => { setTeamFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm"
                    />
                </div>
            )}

            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr>
                            <th className="p-2 w-32 font-semibold">ID</th>
                            <th className="p-2 font-semibold">Valores</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map((row) => (
                            <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                                <td className="p-2 font-mono text-gray-400 truncate">{row.id}</td>
                                <td className="p-1">
                                    <input
                                        type="text"
                                        value={row.values}
                                        onChange={e => handleRowChange(rows.findIndex(r => r.id === row.id), e.target.value)}
                                        className="w-full bg-transparent p-1 rounded focus:bg-gray-700 outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-2 border-t border-gray-700 flex justify-center items-center gap-4">
                <ActionButton onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="!w-auto !py-1 !px-4">Anterior</ActionButton>
                <span className="text-sm font-semibold">Página {currentPage} de {totalPages}</span>
                <ActionButton onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="!w-auto !py-1 !px-4">Próxima</ActionButton>
            </div>
        </div>
    );
};