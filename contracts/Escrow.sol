//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public lender;
    address payable public seller;
    address public inspector;
    address public nftAddress;

    modifier onlySeller() {
        require(msg.sender == seller, "Only Seller can list a Property");
        _;
    }

    modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender == buyer[_nftId], "Only Buyer can list a Property");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only Inspector can list a Property");
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _leander,
        address payable _seller,
        address _nftAddress,
        address _inspector
    ) {
        nftAddress = _nftAddress;
        lender = _leander;
        seller = _seller;
        inspector = _inspector;
    }

    function list(
        uint256 _nftId,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address _buyer
    ) public onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftId);

        isListed[_nftId] = true;
        purchasePrice[_nftId] = _purchasePrice;
        escrowAmount[_nftId] = _escrowAmount;
        buyer[_nftId] = _buyer;
    }

    function depositEarnest(uint256 _nftId) public payable onlyBuyer(_nftId) {
        require(msg.value >= escrowAmount[_nftId]);
    }

    function updateInspectionStatus(uint256 _nftId, bool _passed)
        public
        onlyInspector
    {
        inspectionPassed[_nftId] = _passed;
    }

    receive() external payable {}

    function approveSale(uint256 _nftId) public {
        approval[_nftId][msg.sender] = true;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function finalizeSales(uint256 _nftId) public {
        require(inspectionPassed[_nftId]);
        require(approval[_nftId][buyer[_nftId]]);
        require(approval[_nftId][seller]);
        require(approval[_nftId][lender]);
        require(address(this).balance >= purchasePrice[_nftId]);
    }
}
