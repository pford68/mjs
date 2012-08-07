<%@tag trimDirectiveWhitespaces="true" dynamic-attributes="html" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@attribute name="debug" required="true" type="java.lang.Boolean" %>
<%@attribute name="prod" required="true" type="java.lang.String" description="Paths for production scripts, comman-separated" %>
<%@attribute name="dev" required="true" type="java.lang.String" description="Paths for development scripts, comman-separated" %>

<c:choose>
    <c:when test="${debug == true}">
        <c:forTokens items="${dev}" delims="," var="item">
            <script type="text/javascript" src="${fn:trim(item)}"></script>
        </c:forTokens>
    </c:when>
    <c:otherwise>
        <c:forTokens items="${prod}" delims="," var="item">
            <script type="text/javascript" src="${fn:trim(item)}"></script>
        </c:forTokens>
    </c:otherwise>
</c:choose>