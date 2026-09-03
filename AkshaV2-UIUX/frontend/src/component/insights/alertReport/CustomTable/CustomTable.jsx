import './CustomTable.scss';
import CustomTableBody from './subComponents/CustomTableBody';

//a table can have many tbody but only one thead
const CustomTable = ({ data, showModal }) => {

    return ( <div id="custom-report-table-y-container">
            <table >
                <thead>
                    <tr>
                        <th></th>
                        <th>CAMERA</th>
                        <th>DATE</th>
                        <th>TIME</th>
                        <th>ALERT</th>
                        <th>LINK</th>
                    </tr>
                </thead>

                    {Object.keys(data).map(camName => //only if reportDataaa length greater then zero table displayed
                        <CustomTableBody  //actually table tbody inside each
                            key={camName}
                            camName={camName}
                            data={data}
                            showModal={showModal}
                        />
                    )}
            </table>
        </div>

    );
}

export default CustomTable;



