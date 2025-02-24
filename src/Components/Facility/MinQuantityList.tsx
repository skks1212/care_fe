import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getMinQuantity, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { Button, ButtonBase } from "@material-ui/core";
import { navigate } from "raviger";
import { RoleButton } from "../Common/RoleButton";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function MinQuantityList(props: any) {
  const { facilityId }: any = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const initialInventory: any[] = [];
  let inventoryItem: any = null;
  const [inventory, setInventory] = useState(initialInventory);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getMinQuantity(facilityId, { limit, offset })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInventory(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventory && inventory.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr key={inventoryItem.id} className="bg-white">
        <td className="px-5 py-5 border-b border-gray-200 text-sm ">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-gray-900 whitespace-nowrap">
                {inventoryItem.item_object?.name}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm ">
          <p className="text-gray-900 whitespace-nowrap lowercase">
            {inventoryItem.min_quantity}{" "}
            {inventoryItem.item_object?.default_unit?.name}
          </p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm ">
          <RoleButton
            className="ml-2 bg-primary-400 hover:bg-primary-600"
            handleClickCB={() =>
              navigate(
                `/facility/${facilityId}/inventory/${inventoryItem.id}/update/${inventoryItem.item_object?.id}`
              )
            }
            disableFor="readOnly"
            buttonType="materialUI"
          >
            UPDATE
          </RoleButton>
        </td>
      </tr>
    ));
  } else if (inventory && inventory.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-nowrap">
            No item with minimum quantity set
          </p>
        </td>
      </tr>
    );
  }

  if (isLoading || !inventory) {
    inventoryItem = <Loading />;
  } else if (inventory) {
    inventoryItem = (
      <>
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Minimum Quantity
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
        </div>
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <PageTitle
        title="Minimum Quantity Required"
        hideBack={false}
        className="mx-3 md:mx-8"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          min_quantity: {
            name: "Min Quantity",
            uri: `/facility/${facilityId}/inventory/min_quantity/list`,
          },
          list: {
            style: "pointer-events-none",
          },
        }}
      />
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <RoleButton
            className="ml-2"
            materialButtonProps={{
              variant: "contained",
              color: "primary",
              size: "small",
            }}
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/inventory/min_quantity/set`)
            }
            disableFor="readOnly"
            buttonType="materialUI"
          >
            Set Min Quantity
          </RoleButton>
          {inventoryItem}
        </div>
      </div>
    </div>
  );
}
