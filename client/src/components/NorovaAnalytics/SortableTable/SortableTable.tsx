import React, { Component } from 'react';
import './SortableTable.css';

export interface TableStructure {
    thead: string[];
    tbody: tr[];
}

type tr = {
    key: number;
    td: td[];
}

type td = {
    value?: string | number,
    text: string
}

interface SortableTableProps {
    tableStructure?: TableStructure;
    onTHeadClick?: (cell: HTMLTableHeaderCellElement) => void;
    onTBodyClick?: (cell: HTMLTableCellElement) => void;
}

interface SortableTableState {
    tableStructure: TableStructure;
    sortDirection: undefined | SortDirection;
}

enum SortDirection {
    ASC = 0,
    DESC = 1,
}

const TABLE_ERRORS = Object.freeze({
    DATA_EXCEEDS_NUMBER_OF_COLUMNS: Error(
        'Tablestructure is in no valid condition: ' +
        'Dataset(s) exceed number of columns.' +
        'Please make sure that the table head and the ' +
        'number of table data in each table row match.'
    )
});

export default class SortableTable extends Component<SortableTableProps, SortableTableState> {
    constructor(props: Readonly<SortableTableProps>) {
        super(props);
        const emptyTable: TableStructure = { thead: [], tbody: [] };
        const tableStructure = this.props.tableStructure || emptyTable;
        const thLenght = tableStructure.thead.length;
        const validTableStructure = tableStructure
            .tbody.map(tr => tr.td.length)
            .every(rowLength => rowLength === thLenght);
        if (!validTableStructure) {
            throw TABLE_ERRORS.DATA_EXCEEDS_NUMBER_OF_COLUMNS;
        }
        this.state = {
            tableStructure: tableStructure,
            sortDirection: undefined
        };
    }

    componentWillReceiveProps(nextProps: SortableTableProps) {
        const { tableStructure } = this.state;
        const { tableStructure: nextTableStructure } = nextProps;
        if (nextTableStructure && tableStructure !== nextTableStructure) {
            this.setState(state => ({ ...state, tableStructure: nextTableStructure }));
        }
    }

    getNewSortDirection(): SortDirection {
        const directions = [SortDirection.ASC, SortDirection.DESC];
        const current = this.state.sortDirection;
        if (current === undefined) return SortDirection.DESC;
        return directions[(current - 1) * (-1)];
    }

    onTHeadClick(event: React.MouseEvent<HTMLTableSectionElement>) {
        const headCell = event.target as HTMLTableHeaderCellElement;
        if (this.props.onTHeadClick) {
            this.props.onTHeadClick(headCell);
            return;
        }
        const column = headCell.cellIndex;
        const { sortDirection } = this.state;
        const sortedTbody = this.state.tableStructure.tbody.sort((a: tr, b: tr) => {
            const firstCellValue = a.td[column].value || a.td[column].text;
            const secondCellValue = b.td[column].value || b.td[column].text;
            if (sortDirection === undefined || sortDirection === SortDirection.ASC) {
                return firstCellValue > secondCellValue ? 1 : -1;
            }
            if (sortDirection === SortDirection.DESC) {
                return firstCellValue < secondCellValue ? 1 : -1;
            }
            return 1;
        });
        const updatedTableStructure = { ...this.state.tableStructure, tbody: sortedTbody };
        const updatedSortDirection = this.getNewSortDirection();
        this.toggleSortIcon(headCell);
        this.setState(state => ({
            ...state,
            tableStructure: updatedTableStructure,
            sortDirection: updatedSortDirection
        }));
    }

    toggleSortIcon(headCell: HTMLTableHeaderCellElement) {
        Array.from(headCell.parentElement?.children || []).forEach(th => {
            th.classList.remove('asc');
            th.classList.remove('desc');
        });
        if (
            this.state.sortDirection === undefined ||
            this.state.sortDirection === SortDirection.ASC
        ) {
            headCell.classList.remove('desc');
            headCell.classList.add('asc');
        } else {
            headCell.classList.remove('asc');
            headCell.classList.add('desc');
        }
    }

    onTBodyClick(event: React.MouseEvent<HTMLTableSectionElement>) {
        const cell = event.target as HTMLTableCellElement;
        const row = cell.parentElement as HTMLTableRowElement;
        const tbody = row.parentElement as HTMLTableSectionElement;
        Array.from(tbody.children).forEach(tr => {
            if (tr === row && !tr.classList.contains('active')) {
                tr.classList.add('active');
            } else tr.classList.remove('active');
        });
        if (this.props.onTBodyClick) {
            this.props.onTBodyClick(cell);
            return;
        }
    }

    render() {
        const { tableStructure } = this.state;
        const { thead, tbody } = tableStructure;
        const tableHead = thead.map((columnName, index) => {
            return <th key={index + 1}>{columnName}</th>;
        });
        const tableContent = tbody.map(({ key, td }) => {
            return (
                <tr key={key} data-id={key}>
                    {td.map(({ value, text }, index) => {
                        return <td key={index + 1} data-value={value}>{text}</td>
                    })}
                </tr>
            );
        });
        return (
            <div style={{ display: tableContent.length > 0 ? 'block' : 'none' }}>
                <table className="sortable-table">
                    <thead onClick={this.onTHeadClick.bind(this)}>
                        <tr>{tableHead}</tr>
                    </thead>
                    <tbody onClick={this.onTBodyClick.bind(this)}>
                        {tableContent}
                    </tbody>
                </table>
            </div>
        )
    }
}
